import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const projectRef = 'tfhjupcybietwzmnpwfh';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required');

async function query(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: response.ok, data };
}

function rows(result) {
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.data?.value)) return result.data.value;
  throw new Error('Unexpected database response');
}

async function expectCount(name, sql, expected) {
  const result = await query(sql);
  assert.equal(result.ok, true, `${name}: query failed`);
  assert.equal(Number(rows(result)[0]?.n), expected, `${name}: wrong row count`);
  console.log(`PASS ${name}`);
}

async function expectDenied(name, sql, pattern) {
  const result = await query(sql);
  assert.equal(result.ok, false, `${name}: operation unexpectedly succeeded`);
  assert.match(JSON.stringify(result.data), pattern, `${name}: unexpected error`);
  console.log(`PASS ${name}`);
}

function asUser(userId) {
  return `SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${userId}', true);`;
}

async function main() {
  const users = await query('SELECT id::text FROM auth.users ORDER BY id LIMIT 2');
  assert.equal(users.ok, true);
  const [a, b] = rows(users).map(({ id }) => id);
  assert.match(a, /^[0-9a-f-]{36}$/);
  assert.match(b, /^[0-9a-f-]{36}$/);
  assert.notEqual(a, b);
  const id = `myfrigo-rls-${randomUUID()}`;

  await expectCount(
    'A inserts and reads own subscription',
    `BEGIN; ${asUser(a)}
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','it');
     SELECT count(*) AS n FROM public.user_push_subscriptions WHERE subscription_id='${id}';
     ROLLBACK;`,
    1,
  );
  await expectCount(
    'B inserts and reads own subscription',
    `BEGIN; ${asUser(b)}
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${b}','${id}','en');
     SELECT count(*) AS n FROM public.user_push_subscriptions WHERE subscription_id='${id}';
     ROLLBACK;`,
    1,
  );
  await expectCount(
    'B cannot read A subscription',
    `BEGIN;
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','it');
     ${asUser(b)}
     SELECT count(*) AS n FROM public.user_push_subscriptions WHERE subscription_id='${id}';
     ROLLBACK;`,
    0,
  );
  await expectCount(
    'B cannot update A subscription',
    `BEGIN;
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','it');
     ${asUser(b)}
     WITH changed AS (
       UPDATE public.user_push_subscriptions SET language='en'
       WHERE subscription_id='${id}' RETURNING 1
     ) SELECT count(*) AS n FROM changed;
     ROLLBACK;`,
    0,
  );
  await expectCount(
    'B cannot delete A subscription',
    `BEGIN;
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','it');
     ${asUser(b)}
     WITH removed AS (
       DELETE FROM public.user_push_subscriptions
       WHERE subscription_id='${id}' RETURNING 1
     ) SELECT count(*) AS n FROM removed;
     ROLLBACK;`,
    0,
  );
  await expectCount(
    'A can update own subscription',
    `BEGIN;
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','it');
     ${asUser(a)}
     WITH changed AS (
       UPDATE public.user_push_subscriptions SET language='en'
       WHERE subscription_id='${id}' RETURNING 1
     ) SELECT count(*) AS n FROM changed;
     ROLLBACK;`,
    1,
  );
  await expectCount(
    'A can delete own subscription',
    `BEGIN;
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','it');
     ${asUser(a)}
     WITH removed AS (
       DELETE FROM public.user_push_subscriptions
       WHERE subscription_id='${id}' RETURNING 1
     ) SELECT count(*) AS n FROM removed;
     ROLLBACK;`,
    1,
  );
  await expectDenied(
    'A cannot insert row owned by B',
    `BEGIN; ${asUser(a)}
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${b}','${id}','it'); ROLLBACK;`,
    /row.level security|permission denied/i,
  );
  await expectDenied(
    'A cannot change ownership to B',
    `BEGIN;
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','it');
     ${asUser(a)}
     UPDATE public.user_push_subscriptions SET user_id='${b}'
     WHERE subscription_id='${id}'; ROLLBACK;`,
    /row.level security|permission denied/i,
  );
  await expectDenied(
    'same user and subscription cannot be duplicated',
    `BEGIN; ${asUser(a)}
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','it');
     INSERT INTO public.user_push_subscriptions(user_id,subscription_id,language)
     VALUES ('${a}','${id}','en'); ROLLBACK;`,
    /duplicate key|unique constraint/i,
  );
  await expectDenied(
    'authenticated cannot truncate around RLS',
    `BEGIN; ${asUser(a)} TRUNCATE public.user_push_subscriptions; ROLLBACK;`,
    /permission denied/i,
  );
  await expectDenied(
    'anon cannot truncate around RLS',
    'BEGIN; SET LOCAL ROLE anon; TRUNCATE public.user_push_subscriptions; ROLLBACK;',
    /permission denied/i,
  );
  await expectCount(
    'all temporary test rows rolled back',
    `SELECT count(*) AS n FROM public.user_push_subscriptions WHERE subscription_id='${id}'`,
    0,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
