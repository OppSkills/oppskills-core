import { Injectable } from "@nestjs/common";
import { prisma } from "@oppskills/db";
import { Logger } from "src/_utils/logger";
import type { CollegeImportItemDto } from "@oppskills/types";

/**
 * Result shape for bulk imports.
 * Kept backward compatible with existing API responses while adding useful counters.
 */
type CollegeBulkImportResult = Readonly<{
  imported: number;
  failed: number;
  totalBatches: number;
  errors: string[];
  created: number;
  updated: number;
  skipped: number;
}>;

type NormalizedCollegeImport = Readonly<{
  id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  address: string;
  website: string | null;
  logo: string | null;
}>;

type Ok<T> = Readonly<{ ok: true; value: T }>;
type Err = Readonly<{ ok: false; error: string }>;
type Result<T> = Ok<T> | Err;

@Injectable()
export class CollegesService {
  private readonly logger: Logger = new Logger(CollegesService.name);

  /**
   * Search colleges by name (case-insensitive, partial match).
   * Returns up to 15 matching colleges for combobox.
   */
  async searchColleges(query: string) {
    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedQuery.length === 0) {
      return [];
    }

    const colleges = await prisma.collegeEntity.findMany({
      where: {
        name: {
          contains: normalizedQuery,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        country: true,
        state: true,
        city: true,
        address: true,
        website: true,
        logo: true,
      },
      take: 15,
      orderBy: { name: 'asc' },
    });

    return colleges;
  }

  /**
   * Bulk import colleges by `id` with batching for large datasets.
   *
   * Why this implementation:
   * - Avoids interactive transactions (which can timeout and yield P2028 "Transaction not found")
   * - Uses `createMany({ skipDuplicates: true })` for fast inserts
   * - Uses bounded-concurrency updates for existing rows (so one bad row won't fail the whole batch)
   *
   * Dev-only feature.
   *
   * @param colleges - Array of colleges to import
   * @param batchSize - Number of records per batch (default: 500)
   */
  async bulkImportColleges(
    colleges: CollegeImportItemDto[],
    batchSize: number = 500,
  ) {
    const safeBatchSize = this.coerceBatchSize(batchSize);
    const safeColleges = Array.isArray(colleges) ? colleges : [];

    const results: {
      imported: number;
      failed: number;
      totalBatches: number;
      errors: string[];
      created: number;
      updated: number;
      skipped: number;
    } = {
      imported: 0,
      failed: 0,
      totalBatches: Math.ceil(safeColleges.length / safeBatchSize),
      errors: [],
      created: 0,
      updated: 0,
      skipped: 0,
    };

    this.logger.log(
      `Starting bulk import: ${safeColleges.length} colleges in ${results.totalBatches} batches`,
    );

    // Process in batches
    for (let i = 0; i < safeColleges.length; i += safeBatchSize) {
      const batch = safeColleges.slice(i, i + safeBatchSize);
      const batchNumber = Math.floor(i / safeBatchSize) + 1;

      try {
        const batchOutcome = await this.processBatchFast(batch, {
          updateConcurrency: 10,
        });

        results.imported += batchOutcome.imported;
        results.failed += batchOutcome.failed;
        results.created += batchOutcome.created;
        results.updated += batchOutcome.updated;
        results.skipped += batchOutcome.skipped;
        results.errors.push(...batchOutcome.errors);

        this.logger.log(
          `Batch ${batchNumber}/${results.totalBatches} completed: ${batchOutcome.imported} imported (${batchOutcome.created} created, ${batchOutcome.updated} updated), ${batchOutcome.failed} failed`,
        );
      } catch (error) {
        results.failed += batch.length;
        const errorMsg = `Batch ${batchNumber} failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        results.errors.push(errorMsg);
        this.logger.error(errorMsg, error);
      }
    }

    this.logger.log(
      `Bulk import completed: ${results.imported} imported (${results.created} created, ${results.updated} updated), ${results.failed} failed`,
    );
    const finalResults: CollegeBulkImportResult = {
      imported: results.imported,
      failed: results.failed,
      totalBatches: results.totalBatches,
      errors: results.errors,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
    };
    return finalResults;
  }

  /**
   * Process colleges from a stream/iterator for memory-efficient large file imports.
   * @param collegeIterator - Async iterator yielding colleges
   * @param batchSize - Number of records per batch
   */
  async bulkImportCollegesStreaming(
    collegeIterator: AsyncIterable<CollegeImportItemDto>,
    batchSize: number = 500,
  ) {
    const results: {
      imported: number;
      failed: number;
      batchesProcessed: number;
      errors: string[];
      created: number;
      updated: number;
      skipped: number;
    } = {
      imported: 0,
      failed: 0,
      batchesProcessed: 0,
      errors: [],
      created: 0,
      updated: 0,
      skipped: 0,
    };

    let batch: CollegeImportItemDto[] = [];
    const safeBatchSize = this.coerceBatchSize(batchSize);

    for await (const college of collegeIterator) {
      batch.push(college);

      if (batch.length >= safeBatchSize) {
        await this.processBatch(batch, results);
        batch = [];
      }
    }

    // Process remaining items
    if (batch.length > 0) {
      await this.processBatch(batch, results);
    }

    this.logger.log(
      `Streaming import completed: ${results.imported} imported, ${results.failed} failed`,
    );
    return results;
  }

  private async processBatch(
    batch: CollegeImportItemDto[],
    results: {
      imported: number;
      failed: number;
      batchesProcessed: number;
      errors: string[];
      created: number;
      updated: number;
      skipped: number;
    },
  ) {
    results.batchesProcessed++;

    try {
      const batchOutcome = await this.processBatchFast(batch, {
        updateConcurrency: 10,
      });

      results.imported += batchOutcome.imported;
      results.failed += batchOutcome.failed;
      results.created += batchOutcome.created;
      results.updated += batchOutcome.updated;
      results.skipped += batchOutcome.skipped;
      results.errors.push(...batchOutcome.errors);

      this.logger.log(
        `Batch ${results.batchesProcessed} completed: ${batchOutcome.imported} colleges`,
      );
    } catch (error) {
      results.failed += batch.length;
      const errorMsg = `Batch ${results.batchesProcessed} failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      results.errors.push(errorMsg);
      this.logger.error(errorMsg, error);
    }
  }

  /**
   * Fast, safe batch processor:
   * - Validates and normalizes inputs
   * - Inserts new rows via createMany(skipDuplicates)
   * - Updates existing rows with bounded concurrency (per-row error isolation)
   */
  private async processBatchFast(
    batch: readonly CollegeImportItemDto[],
    opts: Readonly<{ updateConcurrency: number }>,
  ): Promise<
    Readonly<{
      imported: number;
      failed: number;
      errors: string[];
      created: number;
      updated: number;
      skipped: number;
    }>
  > {
    const normalizedById = new Map<string, NormalizedCollegeImport>();
    const errors: string[] = [];
    let failed = 0;
    let skipped = 0;

    for (const item of batch) {
      const normalized = this.normalizeCollege(item);
      if (!normalized.ok) {
        failed += 1;
        errors.push(normalized.error);
        continue;
      }
      // Deduplicate by id inside the batch (last write wins).
      if (normalizedById.has(normalized.value.id)) {
        skipped += 1;
      }
      normalizedById.set(normalized.value.id, normalized.value);
    }

    const normalized = Array.from(normalizedById.values());
    if (normalized.length === 0) {
      return {
        imported: 0,
        failed,
        errors,
        created: 0,
        updated: 0,
        skipped,
      };
    }

    const ids = normalized.map((c) => c.id);
    const existingRows = await prisma.collegeEntity.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const existingIdSet = new Set(existingRows.map((r) => r.id));

    // Insert new rows quickly. Existing rows are ignored by skipDuplicates.
    const toCreate = normalized
      .filter((c) => !existingIdSet.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        country: c.country,
        state: c.state,
        city: c.city,
        address: c.address,
        website: c.website,
        logo: c.logo,
      }));

    let created = 0;
    if (toCreate.length > 0) {
      const createResult = await prisma.collegeEntity.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      // Prisma returns the number of inserted rows (duplicates skipped).
      created = createResult.count;
    }

    // Update existing rows with bounded concurrency to avoid long-lived transactions/timeouts.
    const toUpdate = normalized.filter((c) => existingIdSet.has(c.id));
    let updated = 0;

    const updateConcurrency = this.coerceConcurrencyLimit(opts.updateConcurrency);
    const updateResults = await this.runWithConcurrencyLimit(
      toUpdate,
      updateConcurrency,
      async (c) => {
        await prisma.collegeEntity.update({
          where: { id: c.id },
          data: {
            name: c.name,
            country: c.country,
            state: c.state,
            city: c.city,
            address: c.address,
            website: c.website,
            logo: c.logo,
          },
        });
      },
    );

    for (const r of updateResults) {
      if (r.ok) {
        updated += 1;
      } else {
        failed += 1;
        errors.push(r.error);
      }
    }

    const imported = created + updated;
    return { imported, failed, errors, created, updated, skipped };
  }

  /**
   * Normalize and validate an incoming import item.
   * Rejects rows missing required fields to prevent bad data (instead of silently storing empty strings).
   */
  private normalizeCollege(item: CollegeImportItemDto): Result<NormalizedCollegeImport> {
    const id = this.safeTrim(item.id);
    const name = this.safeTrim(item.name);
    const country = this.safeTrim(item.country);
    const state = this.safeTrim(item.state);
    const city = this.safeTrim(item.city);
    const address = this.safeTrim(item.address);

    if (id.length === 0) return { ok: false, error: "Invalid college: missing id" };
    if (name.length === 0) return { ok: false, error: `Invalid college ${id}: missing name` };
    if (country.length === 0) return { ok: false, error: `Invalid college ${id}: missing country` };
    if (state.length === 0) return { ok: false, error: `Invalid college ${id}: missing state` };
    if (city.length === 0) return { ok: false, error: `Invalid college ${id}: missing city` };
    if (address.length === 0) return { ok: false, error: `Invalid college ${id}: missing address` };

    const websiteRaw = this.safeTrim(item.website);
    const logoRaw = this.safeTrim(item.logo);

    return {
      ok: true,
      value: {
        id,
        name,
        country,
        state,
        city,
        address,
        website: websiteRaw.length > 0 ? websiteRaw : null,
        logo: logoRaw.length > 0 ? logoRaw : null,
      },
    };
  }

  private safeTrim(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  private coerceBatchSize(value: number): number {
    if (!Number.isFinite(value)) return 500;
    const asInt = Math.floor(value);
    if (asInt < 1) return 1;
    if (asInt > 1000) return 1000;
    return asInt;
  }

  private coerceConcurrencyLimit(value: number): number {
    if (!Number.isFinite(value)) return 10;
    const asInt = Math.floor(value);
    if (asInt < 1) return 1;
    if (asInt > 25) return 25;
    return asInt;
  }

  /**
   * Run a list of tasks with a strict concurrency limit.
   * Returns per-item OK/Err so a single failure doesn't fail the whole batch.
   */
  private async runWithConcurrencyLimit<T>(
    items: readonly T[],
    limit: number,
    worker: (item: T) => Promise<void>,
  ): Promise<ReadonlyArray<Result<true>>> {
    const safeLimit = this.coerceConcurrencyLimit(limit);
    const results: Array<Result<true>> = new Array(items.length);

    let nextIndex = 0;
    const runWorker = async (): Promise<void> => {
      while (true) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        if (currentIndex >= items.length) return;
        const item = items[currentIndex];
        try {
          await worker(item);
          results[currentIndex] = { ok: true, value: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          results[currentIndex] = { ok: false, error: msg };
        }
      }
    };

    const runners: Promise<void>[] = [];
    const runnerCount = Math.min(safeLimit, items.length);
    for (let i = 0; i < runnerCount; i += 1) {
      runners.push(runWorker());
    }
    await Promise.all(runners);
    return results;
  }

  /**
   * Get a single college by ID.
   */
  async getCollege(id: string) {
    return prisma.collegeEntity.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        country: true,
        state: true,
        city: true,
        address: true,
        website: true,
        logo: true,
      },
    });
  }
}
