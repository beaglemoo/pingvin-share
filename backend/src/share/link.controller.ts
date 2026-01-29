import {
  Controller,
  Get,
  Param,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ShareService } from "./share.service";

@Controller("l")
export class LinkController {
  constructor(private shareService: ShareService) {}

  @Get(":id")
  async redirectLink(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const shareToken = req.cookies[`share_${id}_token`];
    const { linkUrl } = await this.shareService.getLinkShare(id, shareToken);
    return res.redirect(302, linkUrl);
  }
}
