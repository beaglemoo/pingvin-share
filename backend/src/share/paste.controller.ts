import {
  Controller,
  Get,
  Param,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ShareService } from "./share.service";

@Controller("p")
export class PasteController {
  constructor(private shareService: ShareService) {}

  @Get(":id")
  async getPaste(@Param("id") id: string, @Req() req: Request) {
    const shareToken = req.cookies[`share_${id}_token`];
    return await this.shareService.getPasteShare(id, shareToken);
  }

  @Get(":id/raw")
  async getRawPaste(@Param("id") id: string, @Req() req: Request) {
    const shareToken = req.cookies[`share_${id}_token`];
    const paste = await this.shareService.getPasteShare(id, shareToken);
    return paste.pasteContent;
  }
}
