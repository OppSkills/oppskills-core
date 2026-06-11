/**
 * Seed script — populates SkillCategoryEntity, SkillEntity,
 * and SkillCategorySkillEntity from apps/backend/data.js.
 *
 * ─── Run from the repo root ───────────────────────────────────────────────
 *   pnpm -C apps/backend seed:skills
 *
 * ─── Run directly ─────────────────────────────────────────────────────────
 *   cd apps/backend
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-skills.ts
 *
 * ─── Safe to re-run ───────────────────────────────────────────────────────
 *   All writes use upsert / findFirst+create so duplicate executions are
 *   fully idempotent. Existing platformScore values are never overwritten.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { prisma } from '@oppskills/db';

const { skills } = require('../../data.js') as {
  skills: Record<string, string[]>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts an arbitrary skill name to a URL-safe slug.
 *  e.g. "React.js" → "reactjs", "C++" → "c" (falls back gracefully) */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars (preserves spaces/dashes)
    .replace(/\s+/g, '-') // spaces → single dash
    .replace(/-+/g, '-') // collapse consecutive dashes
    .replace(/^-+|-+$/g, ''); // trim edge dashes
}

/** "softwareDevelopment" → "Software Development" */
function categoryLabel(camelKey: string): string {
  return camelKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// ---------------------------------------------------------------------------
// Find-or-create helpers (idempotent, no reliance on non-unique upsert keys)
// ---------------------------------------------------------------------------

async function findOrCreateCategory(name: string): Promise<string> {
  const existing = await prisma.skillCategoryEntity.findFirst({
    where: { name },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.skillCategoryEntity.create({
    data: { name },
    select: { id: true },
  });
  return created.id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱  Starting skills seed…\n');

  const categoryKeys = Object.keys(skills);
  let totalSkills = 0;
  let totalMappings = 0;

  for (const key of categoryKeys) {
    const categoryName = categoryLabel(key);
    const skillNames: string[] = skills[key] ?? [];

    if (skillNames.length === 0) {
      console.warn(`  ⚠  Skipping empty category: ${categoryName}`);
      continue;
    }

    // 1. Find or create the category
    const categoryId = await findOrCreateCategory(categoryName);
    console.log(`\n📂  [${categoryName}]  (id: ${categoryId})`);

    for (const skillName of skillNames) {
      const slug = slugify(skillName);

      if (!slug) {
        console.warn(`    ⚠  Empty slug for skill "${skillName}" — skipping`);
        continue;
      }

      // 2. Upsert the skill (keyed on unique slug)
      //    platformScore is intentionally never reset so live data survives re-seeding.
      const skill = await prisma.skillEntity.upsert({
        where: { slug },
        create: { name: skillName, slug, platformScore: 0 },
        update: { name: skillName }, // fix casing drift only
        select: { id: true },
      });

      // 3. Upsert the category ↔ skill join-table row
      await prisma.skillCategorySkillEntity.upsert({
        where: {
          skillId_categoryId: { skillId: skill.id, categoryId },
        },
        create: { skillId: skill.id, categoryId },
        update: {}, // nothing to update — the row just needs to exist
      });

      console.log(`    ✓  ${skillName}  (slug: ${slug})`);
      totalSkills++;
      totalMappings++;
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log('✅  Seed complete!');
  console.log(`   Categories : ${categoryKeys.length}`);
  console.log(`   Skills     : ${totalSkills}`);
  console.log(`   Mappings   : ${totalMappings}`);
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((err) => {
    console.error('\n❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
