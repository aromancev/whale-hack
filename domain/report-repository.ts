import { kvStore, type KvStore } from "@/platform/kv-store";
import { ReportSchema, type Report } from "./report";

const reportIndexKey = "reports:index";

export class ReportRepository {
  private readonly kv: KvStore;

  constructor(dependencies: { kv?: KvStore } = {}) {
    this.kv = dependencies.kv ?? kvStore;
  }

  async save(report: Report) {
    const validReport = ReportSchema.parse(report);
    await this.kv.set(this.reportKey(validReport.id), JSON.stringify(validReport));
    await this.addReportId(validReport.id);
    return validReport;
  }

  get(id: string) {
    return this.getReport(id);
  }

  async getMany(ids: string[]) {
    const storedReports = await this.kv.getMany(ids.map((id) => this.reportKey(id)));

    return storedReports
      .map((storedReport) => {
        if (!storedReport) {
          return null;
        }

        return ReportSchema.parse(JSON.parse(storedReport));
      })
      .filter((report): report is Report => report !== null);
  }

  async list() {
    const ids = await this.getReportIds();

    return this.getMany(ids);
  }

  async delete(id: string) {
    await this.kv.delete(this.reportKey(id));
    await this.removeReportId(id);
  }

  private async getReport(id: string) {
    const storedReport = await this.kv.get(this.reportKey(id));

    if (!storedReport) {
      return null;
    }

    return ReportSchema.parse(JSON.parse(storedReport));
  }

  private async removeReportId(id: string) {
    const ids = await this.getReportIds();

    await this.kv.set(
      reportIndexKey,
      JSON.stringify(ids.filter((existingId) => existingId !== id)),
    );
  }

  private async addReportId(id: string) {
    const ids = await this.getReportIds();

    await this.kv.set(
      reportIndexKey,
      JSON.stringify([id, ...ids.filter((existingId) => existingId !== id)]),
    );
  }

  private async getReportIds() {
    const value = await this.kv.get(reportIndexKey);

    if (!value) {
      return [];
    }

    return JSON.parse(value) as string[];
  }

  private reportKey(id: string) {
    return `reports:item:${encodeURIComponent(id)}`;
  }
}

export const reportRepository = new ReportRepository();
