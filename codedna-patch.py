"""codedna-patch.py — CodeDNA monkey-patch for Expo/React Native projects with @/ path aliases.

Patches TreeSitterTypeScriptAdapter to:
1. Resolve @/ imports using tsconfig.json paths
2. Capture export default function/component names

Usage:
    python codedna-patch.py <codedna-command> [args...]

Examples:
    python codedna-patch.py init . --model openrouter/baidu/cobuddy:free --force
    python codedna-patch.py check .
    python codedna-patch.py refresh .

Any codedna subcommand works - this script patches the module, then delegates.

2. The module must preserve the original file encoding and line endings when patching source files.
3. External dependencies are limited to the standard library and codedna_tool package imports.

- All file path and alias resolution logic depends on the presence and correct structure of `tsconfig.json` in the repository root; any modification to path resolution must maintain this dependency.

- The `_patch_extract_info` function has a hard dependency on `codedna_tool.languages._ts_typescript`; this import path MUST remain unchanged or the patching mechanism will break.
- All functions except `main()` MUST remain importable without triggering CLI side effects; `import codedna_tool.cli` MUST only occur inside `_patch_run_lang_files`.

- File walking and alias resolution assume a single `repo_root` passed at call time; all functions must maintain this explicit dependency and never assume a global or cached path.
- The module structure is a flat set of top-level functions with no class boundary; any additions must follow the same pattern without introducing classes or stateful modules.

- Import statements are intentionally lazy (inside function bodies) to avoid circular imports and reduce startup overhead; never move imports to module level without explicit justification.

exports: main()
used_by: none
rules:   - The module is a self-contained patch injection system that modifies CodeDNA's internal collection and header injection behavior at runtime; any edits must maintain the ability to monkey-patch `_cli_mod`, `_walk_files_fast`, and header injection functions without breaking the patching chain.
- All file paths and alias resolution rely on `tsconfig.json` and `Path` objects; any changes to path handling must preserve the recursive walk logic and the skip-directory filtering mechanism.
agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
message: 
"""

import json
import os
import sys
from pathlib import Path


def _load_tsconfig_aliases(repo_root: Path) -> dict[str, str]:
    tsconfig_path = repo_root / "tsconfig.json"
    if not tsconfig_path.exists():
        return {}
    try:
        with open(tsconfig_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}
    compiler = cfg.get("compilerOptions", {})
    base_url = compiler.get("baseUrl", ".")
    paths = compiler.get("paths", {})
    aliases: dict[str, str] = {}
    for pattern, targets in paths.items():
        alias_prefix = pattern.rstrip("/*")
        if alias_prefix and targets:
            target = targets[0].rstrip("/*")
            alias_path = (repo_root / base_url / target).resolve()
            try:
                aliases[alias_prefix] = str(alias_path.relative_to(repo_root))
            except ValueError:
                aliases[alias_prefix] = str(alias_path)
    return aliases


def _resolve_alias_import(import_path: str, aliases: dict[str, str]) -> str | None:
    for alias_prefix, alias_target in aliases.items():
        if import_path.startswith(alias_prefix + "/"):
            remainder = import_path[len(alias_prefix) + 1:]
            return alias_target + "/" + remainder if remainder else alias_target
    return None


def _walk_files_fast(target: Path, skip_dirs: frozenset) -> list[Path]:
    """Walk files using os.walk, pruning skip_dirs before descending.

    Avoids rglob(*) which traverses into node_modules/ before the skip check.
    """
    files: list[Path] = []
    target_str = str(target)
    for root, dirs, filenames in os.walk(target_str, topdown=True):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        root_path = Path(root)
        for fn in filenames:
            files.append(root_path / fn)
    return files


def _patch_collect_files():
    import fnmatch

    import codedna_tool.cli as _cli_mod

    original_collect_files = _cli_mod.collect_files

    def patched_collect_files(
        target: Path, exclude: list[str], extensions: list[str] | None = None
    ) -> list[Path]:
        if extensions is None:
            extensions = [".py"]
        if target.is_file():
            return [target] if _cli_mod._get_extension(target) in extensions else []

        skip = _cli_mod._DEFAULT_SKIP_DIRS
        expanded_exclude = _cli_mod._expand_exclude(exclude)
        files: list[Path] = []
        for f in _walk_files_fast(target, skip):
            if _cli_mod._get_extension(f) not in extensions:
                continue
            if f.suffix == ".go" and f.stem.endswith("_test"):
                continue
            rel_str = str(f.relative_to(target))
            if any(fnmatch.fnmatch(rel_str, p) or f.match(p) for p in expanded_exclude):
                continue
            files.append(f)
        return files

    _cli_mod.collect_files = patched_collect_files

    original_auto_detect = _cli_mod._auto_detect_extensions

    def patched_auto_detect_extensions(target: Path) -> list[str]:
        skip = frozenset({
            "__pycache__", ".git", "venv", ".venv", "node_modules",
            "migrations", "dist", "build", ".tox", ".mypy_cache",
        })
        found: set[str] = {".py"}
        if not target.is_dir():
            ext = _cli_mod._get_extension(target)
            if _cli_mod.get_adapter(ext):
                found.add(ext)
            return sorted(found)
        for f in _walk_files_fast(target, skip):
            ext = _cli_mod._get_extension(f)
            if ext not in found and _cli_mod.get_adapter(ext):
                found.add(ext)
        return sorted(found)

    _cli_mod._auto_detect_extensions = patched_auto_detect_extensions


def _patch_inject_header():
    """Patch TypeScriptAdapter.inject_header to always strip+rebuild.

    Original inject_header checks has_codedna_header() and returns source unchanged
    if a header exists — this defeats --force. The patched version strips any
    existing CodeDNA header before prepending the new one, so --force actually works.
    """
    import re

    from codedna_tool.languages.typescript import TypeScriptAdapter

    original = TypeScriptAdapter.inject_header

    def patched(self, source, rel, exports, used_by, rules, model_id, today):
        # Strip existing CodeDNA header block (from start of file to after // message:)
        pattern = r'^// .+? [-—] .+?\n//\n(?:// .+\n)*// message:\s*\n*'
        cleaned = re.sub(pattern, '', source, count=1, flags=re.MULTILINE)

        header_lines = self._build_header_lines(rel, exports, used_by, rules, model_id, today)
        header = "\n".join(header_lines) + "\n\n"

        lines = cleaned.splitlines(keepends=True)
        if lines and lines[0].startswith("#!"):
            return lines[0] + header + "".join(lines[1:])
        return header + cleaned

    TypeScriptAdapter.inject_header = patched


def _patch_extract_info(aliases: dict[str, str]):
    from codedna_tool.languages._ts_typescript import (
        TreeSitterTypeScriptAdapter,
        TypeScriptAdapter,
        LangFileInfo,
        LangFuncInfo,
        _t,
        _IMPORT_QUERY,
    )

    original_extract_info = TreeSitterTypeScriptAdapter.extract_info

    def patched_extract_info(self, path: Path, repo_root: Path) -> LangFileInfo:
        result = original_extract_info(self, path, repo_root)

        raw_imports = self._query_strings(
            path.read_text(encoding="utf-8", errors="replace").encode("utf-8"),
            _IMPORT_QUERY,
        )

        alias_deps: list[str] = []
        for imp in raw_imports:
            if imp.startswith("."):
                continue
            resolved_alias = _resolve_alias_import(imp, aliases)
            if resolved_alias is None:
                continue
            resolved_path = TypeScriptAdapter._resolve_import(
                repo_root / "__fake__", "." + "/" + resolved_alias, repo_root
            )
            if resolved_path and resolved_path not in result.deps and resolved_path not in alias_deps:
                alias_deps.append(resolved_path)

        if alias_deps:
            new_deps = list(result.deps) + alias_deps
            result = LangFileInfo(
                path=result.path,
                rel=result.rel,
                exports=result.exports,
                deps=new_deps,
                funcs=result.funcs,
                has_codedna=result.has_codedna,
                parseable=result.parseable,
            )

        source = path.read_text(encoding="utf-8", errors="replace")
        default_exports = _extract_default_exports(source)
        if default_exports:
            existing = set(result.exports)
            new_exports = list(result.exports)
            for name in default_exports:
                if name not in existing:
                    new_exports.append(name)
            if len(new_exports) != len(result.exports):
                result = LangFileInfo(
                    path=result.path,
                    rel=result.rel,
                    exports=new_exports,
                    deps=result.deps,
                    funcs=result.funcs,
                    has_codedna=result.has_codedna,
                    parseable=result.parseable,
                )

        return result

    TreeSitterTypeScriptAdapter.extract_info = patched_extract_info


def _extract_default_exports(source: str) -> list[str]:
    import re

    names: list[str] = []

    # export default function/class
    for m in re.finditer(
        r"^export\s+default\s+function\s+(\w+)", source, re.MULTILINE
    ):
        names.append(m.group(1))

    for m in re.finditer(
        r"^export\s+default\s+class\s+(\w+)", source, re.MULTILINE
    ):
        names.append(m.group(1))

    for m in re.finditer(
        r"^export\s+default\s+(\w+)", source, re.MULTILINE
    ):
        name = m.group(1)
        if name not in names:
            names.append(name)

    for m in re.finditer(
        r"^(?:const|let|var|function)\s+(\w+)\s*=.*\nexport\s+default\s+\1",
        source,
        re.MULTILINE,
    ):
        if m.group(1) not in names:
            names.append(m.group(1))

    # Named exports (fallback when TreeSitter TSX parsing fails)
    for m in re.finditer(
        r"^export\s+function\s+(\w+)", source, re.MULTILINE
    ):
        name = m.group(1)
        if name not in names:
            names.append(name)

    for m in re.finditer(
        r"^export\s+(?:const|let|var)\s+(\w+)", source, re.MULTILINE
    ):
        name = m.group(1)
        if name not in names:
            names.append(name)

    for m in re.finditer(
        r"^export\s+class\s+(\w+)", source, re.MULTILINE
    ):
        name = m.group(1)
        if name not in names:
            names.append(name)

    for m in re.finditer(
        r"^export\s+interface\s+(\w+)", source, re.MULTILINE
    ):
        name = m.group(1)
        if name not in names:
            names.append(name)

    for m in re.finditer(
        r"^export\s+type\s+(\w+)", source, re.MULTILINE
    ):
        name = m.group(1)
        if name not in names:
            names.append(name)

    return names


def _patch_run_lang_files():
    import codedna_tool.cli as _cli_mod

    original_run_lang_files = _cli_mod.run_lang_files

    def patched_run_lang_files(
        target, extensions, repo_root, exclude, model, dry_run, force, no_llm, verbose, api_key,
    ):
        from codedna_tool.cli import (
            collect_files, get_adapter, _get_extension, scan_file_lang,
            build_used_by, _fmt_exports, _fmt_used_by,
            LLM, date,
        )

        lang_exts = [e for e in extensions if e != ".py" and get_adapter(e) is not None]
        if not lang_exts:
            return 0, 0

        lang_files = collect_files(target, exclude, extensions=lang_exts)
        if not lang_files:
            return 0, 0

        print(f"\nMulti-language pass ({', '.join(lang_exts)})  {len(lang_files)} files")

        llm = None
        if not no_llm:
            try:
                llm = LLM(model=model, api_key=api_key)
            except Exception as e:
                print(f"  Warning: LLM unavailable ({e}). rules: will be 'none'")

        today = date.today().isoformat()
        annotated = 0
        llm_calls = 0

        lang_infos = {}
        for path in lang_files:
            adapter = get_adapter(_get_extension(path))
            if adapter is not None:
                lang_infos[str(path.relative_to(repo_root))] = scan_file_lang(path, repo_root, adapter)
        ub_graph_lang = build_used_by(lang_infos)

        for path in lang_files:
            adapter = get_adapter(_get_extension(path))
            if adapter is None:
                continue

            info = adapter.extract_info(path, repo_root)
            if not info.parseable:
                if verbose:
                    print(f"  SKIP (unreadable)  {info.rel}")
                continue

            if info.has_codedna and not force:
                if verbose:
                    print(f"  skip (annotated)   {info.rel}")
                continue

            source = path.read_text(encoding="utf-8", errors="replace")
            exports_str = _fmt_exports(info.exports)
            used_by_str = _fmt_used_by(ub_graph_lang.get(info.rel, {}))

            rules_str = "none"
            if llm and info.exports:
                try:
                    snippet = source[:2000]
                    rules_str = llm.module_rules_raw(info.rel, snippet)
                    llm_calls += 1
                except Exception:
                    rules_str = "none"

            agent_id = "codedna-cli (no-llm)" if no_llm else model
            new_source = adapter.inject_header(
                source, info.rel, exports_str, used_by_str, rules_str, agent_id, today
            )

            if new_source != source:
                if not dry_run:
                    path.write_text(new_source, encoding="utf-8")
                annotated += 1
                if verbose:
                    print(f"  L1  {info.rel}  exports: {exports_str[:60]}")

        print(f"  Annotated {annotated} non-Python files")
        return annotated, llm_calls

    _cli_mod.run_lang_files = patched_run_lang_files


def main():
    """
    Rules:   Must handle UTF-8 encoding for stdout/stderr and expect tsconfig aliases file in repo root
    """
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

    repo_root = Path.cwd()

    aliases = _load_tsconfig_aliases(repo_root)
    if aliases:
        print(f"[codedna-patch] Loaded aliases: {aliases}")
    else:
        print("[codedna-patch] No tsconfig aliases found, patching exports only")

    _patch_extract_info(aliases)
    _patch_inject_header()  # survives reload (separate module from cli)
    _patch_run_lang_files()

    from codedna_tool import cli as _cli_mod
    import importlib
    importlib.reload(_cli_mod)

    # Apply dir-walking patches AFTER reload so they survive into cmd_refresh/cmd_init
    _patch_collect_files()

    from codedna_tool.cli import main as codedna_main

    sys.argv = [sys.argv[0]] + sys.argv[1:]
    codedna_main()


if __name__ == "__main__":
    main()
