import axios from "axios";
import { logger } from "@/shared/utils/logger";
import { AppError } from "@/shared/utils/AppError";

export class FileFetcherService {
  async fetchBuffer(
    url: string,
    context?: {
      mimetype?: string;
      matcher?: string;
      userId?: string;
    }
  ): Promise<Buffer> {
    try {
      const res = await axios.get<ArrayBuffer>(url, {
        responseType: "arraybuffer",
      });

      logger.info({
        action: "FILE_FETCH_SUCCESS",
        context: "FILE_FETCHER",
        url,
        status: res.status,
        contentLength: res.headers["content-length"],
      });

      return Buffer.from(res.data);
    } catch (error: any) {
      logger.error({
        action: "FILE_FETCH_FAILED",
        context: "FILE_FETCHER",
        url,
        mimetype: context?.mimetype,
        matcher: context?.matcher,
        userId: context?.userId,
        error,
      });

      throw new AppError("Failed to fetch file buffer", 500);
    }
  }
}
