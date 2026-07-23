
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Fallback to .env

import dbConnect from '../src/lib/db';
import Category from '../src/models/Category';
import SubCategory from '../src/models/SubCategory';
import ChildCategory from '../src/models/ChildCategory';
import SubChildCategory from '../src/models/SubChildCategory';

async function verifyHierarchy() {
    await dbConnect();

    console.log('--- Verifying Category Hierarchy ---');

    // 1. Get a random Category
    const category = await Category.findOne({ isActive: true });
    if (!category) {
        console.log('No active categories found.');
        return;
    }
    console.log(`1. Found Category: ${category.name} (${category._id})`);

    // 2. Get SubCategories for this Category
    const subCategories = await SubCategory.find({ categoryId: category._id, isActive: true });
    console.log(`2. Found ${subCategories.length} SubCategories for Category ${category.name}`);

    if (subCategories.length === 0) {
        console.log('Stopping: No subcategories to traverse.');
        return;
    }

    const subCategory = subCategories[0];
    console.log(`   - Selected SubCategory: ${subCategory.name} (${subCategory._id})`);

    // 3. Get ChildCategories for this SubCategory
    const childCategories = await ChildCategory.find({ subCategoryId: subCategory._id, isActive: true });
    console.log(`3. Found ${childCategories.length} ChildCategories for SubCategory ${subCategory.name}`);

    if (childCategories.length === 0) {
        console.log('Stopping: No child categories to traverse.');
        return;
    }

    const childCategory = childCategories[0];
    console.log(`   - Selected ChildCategory: ${childCategory.name} (${childCategory._id})`);

    // 4. Get SubChildCategories for this ChildCategory
    const subChildCategories = await SubChildCategory.find({ childCategoryId: childCategory._id, isActive: true });
    console.log(`4. Found ${subChildCategories.length} SubChildCategories for ChildCategory ${childCategory.name}`);

    if (subChildCategories.length > 0) {
        console.log(`   - First SubChildCategory: ${subChildCategories[0].name}`);
    }

    console.log('--- Verification Complete ---');
    process.exit(0);
}

verifyHierarchy().catch(console.error);
