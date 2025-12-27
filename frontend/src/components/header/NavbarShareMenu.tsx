import { ActionIcon, Menu } from "@mantine/core";
import Link from "next/link";
import { TbArrowLoopLeft, TbClipboardText, TbExternalLink, TbLink } from "react-icons/tb";
import { FormattedMessage } from "react-intl";

const NavbarShareMneu = () => {
  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <ActionIcon>
          <TbLink />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item component={Link} href="/account/shares" icon={<TbLink />}>
          <FormattedMessage id="navbar.links.shares" />
        </Menu.Item>
        <Menu.Item
          component={Link}
          href="/account/reverseShares"
          icon={<TbArrowLoopLeft />}
        >
          <FormattedMessage id="navbar.links.reverse" />
        </Menu.Item>
        <Menu.Item
          component={Link}
          href="/link"
          icon={<TbExternalLink />}
        >
          <FormattedMessage id="navbar.links.link" />
        </Menu.Item>
        <Menu.Item
          component={Link}
          href="/paste"
          icon={<TbClipboardText />}
        >
          <FormattedMessage id="navbar.links.paste" />
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default NavbarShareMneu;
