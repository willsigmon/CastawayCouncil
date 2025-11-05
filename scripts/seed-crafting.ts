import { db } from '../drizzle/db';
import { craftingRecipes } from '../drizzle/schema';
import { craftingRecipes as recipes } from '@game-logic';

async function seedCraftingRecipes() {
  console.log('🔨 Seeding crafting recipes...');

  try {
    // Clear existing recipes
    await db.delete(craftingRecipes);

    // Insert all recipes
    for (const recipe of recipes) {
      await db.insert(craftingRecipes).values({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients,
        resultItem: recipe.resultItem,
        resultQuantity: recipe.resultQuantity,
        unlockCondition: recipe.unlockCondition || null,
      });

      console.log(`  ✓ Added recipe: ${recipe.name}`);
    }

    console.log(`\n✅ Successfully seeded ${recipes.length} crafting recipes!`);
  } catch (error) {
    console.error('❌ Failed to seed crafting recipes:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedCraftingRecipes()
    .then(() => {
      console.log('\n🎉 Crafting recipes seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed failed:', error);
      process.exit(1);
    });
}

export { seedCraftingRecipes };
