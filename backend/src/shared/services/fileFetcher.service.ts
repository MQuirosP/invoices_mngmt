import axios from "axios";
import { logger } from "@/shared/utils/logging/logger";
import { AppError } from "@/shared/utils/appError.utils";

export class FileFetcherService {
  async fetchBuffer(
    url: string,
    context?: {
      mimetype?: string;
      matcher?: string;
      userId?: string;
    }
  ): Promise<Buffer> {
    const timestamp = new Date().toISOString();

    try {
      const res = await axios.get<ArrayBuffer>(url, {
        responseType: "arraybuffer",
      });

      logger.info({
        layer: "service",
        module: "file-fetcher",
        action: "FILE_FETCH_SUCCESS",
        url,
        status: res.status,
        contentLength: res.headers["content-length"],
        mimetype: context?.mimetype,
        matcher: context?.matcher,
        userId: context?.userId,
        timestamp,
      });

      return Buffer.from(res.data);
    } catch (error: any) {
      logger.error({
        layer: "service",
        module: "file-fetcher",
        action: "FILE_FETCH_FAILED",
        url,
        mimetype: context?.mimetype,
        matcher: context?.matcher,
        userId: context?.userId,
        error: error instanceof Error ? error.message : String(error),
        timestamp,
      });

      throw new AppError("Failed to fetch file buffer", 500, true, error, {
        layer: "service",
        module: "file-fetcher",
        reason: "AXIOS_REQUEST_FAILED",
        url,
        mimetype: context?.mimetype,
        matcher: context?.matcher,
        userId: context?.userId,
        timestamp,
      });
    }
  }
}