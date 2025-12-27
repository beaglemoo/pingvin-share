import {
  Controller,
  Get,
  Param,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ShareService } from "./share.service";

@Controller("l")
export class LinkController {
  constructor(private shareService: ShareService) {}

  @Get(":id")
  async redirectLink(@Param("id") id: string, @Res() res: Response) {
    const { linkUrl } = await this.shareService.getLinkShare(id);
    return res.redirect(302, linkUrl);
  }
}
