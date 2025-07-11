import axios from "axios";

export class FileFetcherService {
  async fetchBuffer(url: string): Promise<Buffer> {
    const res = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
  }
}
