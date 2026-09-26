// categories.ts — english catalog for the `categories` domain.
//
// exports: categoriesEn
// used_by: i18n/catalogs/en/index.ts
// rules:   Must expose exactly the same keys as `categoriesIt` — enforced at
//          compile time by the `satisfies` constraint (missing/extra keys fail tsc).
// agent:   executor | 2026-09-22 | Fase A i18n | base keys (content migrates in Fase B)

import { categoriesIt } from '../it/categories';

export const categoriesEn = {
  title: 'Categories',
  selectCategoryNamed: 'Select category {{name}}',
  addNewTitle: 'Add new category',
  addAction: 'Add',
  nameRequiredError: 'The category name cannot be empty.',
  createFailedError: 'Could not create the category. Try again.',
  createNewTitle: 'Create new category',
  namePlaceholder: 'Category name',
  createAction: 'Create',
  deleteConfirmTitle: 'Confirm deletion',
  deleteConfirmMessage: 'Are you sure you want to delete this category? This cannot be undone.',
  duplicateNameError: 'A category with this name already exists.',
  updateFailedError: 'Could not update the category.',
  editCategoryLabel: 'Edit category',
  deleteCategoryLabel: 'Delete category',
  manageTitle: 'Manage categories',
  manageInfo: 'Create, edit or delete your custom categories here. Standard categories cannot be edited.',
  noCustomCategories: 'No custom categories.',
  editNameTitle: 'Edit category name',
  cancelEditLabel: 'Cancel editing',
  saveEditLabel: 'Save changes',
  newNamePlaceholder: 'New category name',
  cancelCreateLabel: 'Cancel category creation',
  confirmCreateLabel: 'Confirm category creation',
  all: 'All',
  empty: 'No categories',
  standard_beverages: 'Drinks',
  standard_biscuits: 'Biscuits',
  standard_meat: 'Meat',
  standard_grains: 'Cereals',
  standard_condiments: 'Condiments',
  standard_canned: 'Tinned food',
  standard_sweets: 'Desserts',
  standard_flour: 'Flour',
  standard_cheese: 'Cheese',
  standard_fruits: 'Fruit',
  standard_ice_cream: 'Ice cream',
  standard_dairy: 'Dairy',
  standard_milk: 'Milk',
  standard_legumes: 'Pulses',
  standard_jam: 'Jam',
  standard_honey: 'Honey',
  standard_pasta: 'Pasta',
  standard_pomodoro: 'Tomatoes',
  standard_fish: 'Fish',
  standard_rice: 'Rice',
  standard_snacks: 'Snacks',
  standard_sauces: 'Sauces',
  standard_frozen: 'Frozen food',
  standard_eggs: 'Eggs',
  standard_vegan: 'Vegan',
  standard_vegetables: 'Vegetables',
} satisfies Record<keyof typeof categoriesIt, string>;
