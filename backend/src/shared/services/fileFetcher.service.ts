import axios from "axios";
import { logger } from "@/shared/utils/logger";

export class FileFetcherService {
  async fetchBuffer(url: string): Promise<Buffer> {
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
    });
    logger.info({
      action: "FILE_FETCH_SUCCESS",
      context: "FILE_FETCHER",
      url,
    });

    return Buffer.from(res.data);
  }
}
