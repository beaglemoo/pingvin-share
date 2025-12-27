import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from "@nestjs/common";
import { ShareService } from "./share.service";

@Controller("p")
export class PasteController {
  constructor(private shareService: ShareService) {}

  @Get(":id")
  async getPaste(@Param("id") id: string) {
    return await this.shareService.getPasteShare(id);
  }

  @Get(":id/raw")
  async getRawPaste(@Param("id") id: string) {
    const paste = await this.shareService.getPasteShare(id);
    return paste.pasteContent;
  }
}
