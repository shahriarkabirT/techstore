export const CATEGORY_LEVELS = {
    0: {
        api: '/api/categories', // Keep for reference if needed, though Redux uses endpoints
        parentApi: null,
        parentField: null,
        title: 'Categories',
        subtitle: 'Manage top-level categories',
        parentLabel: null
    },
    1: {
        api: '/api/subcategories',
        parentApi: '/api/categories',
        parentField: 'categoryId',
        title: 'Sub Categories',
        subtitle: 'Manage second-level categories',
        parentLabel: 'Parent Category'
    },
    2: {
        api: '/api/childcategories',
        parentApi: '/api/subcategories',
        parentField: 'subCategoryId',
        title: 'Child Categories',
        subtitle: 'Manage third-level categories',
        parentLabel: 'Sub Category'
    },
    3: {
        api: '/api/subchildcategories',
        parentApi: '/api/childcategories',
        parentField: 'childCategoryId',
        title: 'Sub-Child Categories',
        subtitle: 'Manage fourth-level categories',
        parentLabel: 'Child Category'
    }
} as const;

export type CategoryLevel = keyof typeof CATEGORY_LEVELS;
