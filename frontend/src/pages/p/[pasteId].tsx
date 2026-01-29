import {
  ActionIcon,
  Box,
  Code,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import dayjs from "dayjs";
import { GetServerSidePropsContext } from "next";
import { useEffect, useState } from "react";
import { TbCopy, TbDownload, TbExternalLink } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import showEnterPasswordModal from "../../components/share/showEnterPasswordModal";
import showErrorModal from "../../components/share/showErrorModal";
import useTranslate from "../../hooks/useTranslate.hook";
import api from "../../services/api.service";
import shareService from "../../services/share.service";
import toast from "../../utils/toast.util";

type PasteData = {
  id: string;
  name: string | null;
  description: string | null;
  pasteContent: string;
  pasteSyntax: string | null;
  views: number;
  expiration: string;
  createdAt: string;
};

export function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: { pasteId: context.params!.pasteId },
  };
}

const PasteView = ({ pasteId }: { pasteId: string }) => {
  const t = useTranslate();
  const theme = useMantineTheme();
  const clipboard = useClipboard();
  const modals = useModals();

  const [paste, setPaste] = useState<PasteData | null>(null);
  const [loading, setLoading] = useState(true);

  const getShareToken = async (password?: string) => {
    await shareService
      .getShareToken(pasteId, password)
      .then(() => {
        modals.closeAll();
        getPaste();
      })
      .catch((e) => {
        const { error } = e.response?.data || {};
        if (error == "share_max_views_exceeded") {
          showErrorModal(
            modals,
            t("share.error.visitor-limit-exceeded.title"),
            t("share.error.visitor-limit-exceeded.description"),
            "go-home",
          );
        } else if (error == "share_password_required") {
          showEnterPasswordModal(modals, getShareToken);
        } else {
          toast.axiosError(e);
        }
      });
  };

  const getPaste = async () => {
    api
      .get(`/p/${pasteId}`)
      .then((res) => {
        setPaste(res.data);
        setLoading(false);
      })
      .catch((e) => {
        const { error } = e.response?.data || {};
        if (e.response?.status == 404) {
          if (error == "share_removed") {
            showErrorModal(
              modals,
              t("share.error.removed.title"),
              e.response.data.message,
              "go-home",
            );
          } else {
            showErrorModal(
              modals,
              t("paste.view.error"),
              t("paste.view.not-found"),
              "go-home",
            );
          }
        } else if (error == "share_password_required") {
          showEnterPasswordModal(modals, getShareToken);
        } else if (error == "share_token_required") {
          getShareToken();
        } else {
          showErrorModal(
            modals,
            t("common.error"),
            e.response?.data?.message || t("common.error.unknown"),
            "go-home",
          );
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    getPaste();
  }, [pasteId]);

  const copyContent = () => {
    if (paste) {
      clipboard.copy(paste.pasteContent);
      toast.success(t("paste.notify.copied"));
    }
  };

  const downloadContent = () => {
    if (!paste) return;

    const extension = paste.pasteSyntax || "txt";
    const filename = paste.name
      ? `${paste.name}.${extension}`
      : `${paste.id}.${extension}`;

    const blob = new Blob([paste.pasteContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !paste) {
    return (
      <>
        <Meta title={t("paste.view.loading")} />
        <Text>
          <FormattedMessage id="paste.view.loading" />
        </Text>
      </>
    );
  }

  if (!paste) {
    return (
      <>
        <Meta title={t("paste.view.title", { id: pasteId })} />
      </>
    );
  }

  const lineCount = paste.pasteContent.split("\n").length;

  return (
    <>
      <Meta title={paste.name || t("paste.view.title", { id: pasteId })} />

      <Stack spacing="md">
        <Group position="apart">
          <Box>
            <Title order={3}>{paste.name || paste.id}</Title>
            {paste.description && (
              <Text size="sm" color="dimmed">
                {paste.description}
              </Text>
            )}
          </Box>
          <Group spacing="xs">
            <Tooltip label={t("paste.action.copy")}>
              <ActionIcon
                onClick={copyContent}
                size="lg"
                variant="light"
                color="victoria"
              >
                <TbCopy size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("paste.action.download")}>
              <ActionIcon
                onClick={downloadContent}
                size="lg"
                variant="light"
                color="victoria"
              >
                <TbDownload size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("paste.action.raw")}>
              <ActionIcon
                component="a"
                href={`/api/p/${pasteId}/raw`}
                target="_blank"
                size="lg"
                variant="light"
                color="victoria"
              >
                <TbExternalLink size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Group spacing="md">
          <Text size="xs" color="dimmed">
            <FormattedMessage
              id="paste.info.views"
              values={{ count: paste.views }}
            />
          </Text>
          {paste.pasteSyntax && (
            <Text size="xs" color="dimmed">
              <FormattedMessage
                id="paste.info.syntax"
                values={{ syntax: paste.pasteSyntax }}
              />
            </Text>
          )}
          <Text size="xs" color="dimmed">
            <FormattedMessage
              id="paste.info.lines"
              values={{ count: lineCount }}
            />
          </Text>
          <Text size="xs" color="dimmed">
            <FormattedMessage
              id="paste.info.created"
              values={{ date: dayjs(paste.createdAt).format("LLL") }}
            />
          </Text>
        </Group>

        <Paper
          withBorder
          p="md"
          sx={{
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[8]
                : theme.colors.gray[0],
          }}
        >
          <ScrollArea>
            <Code
              block
              sx={{
                whiteSpace: "pre",
                fontFamily: "monospace",
                fontSize: theme.fontSizes.sm,
                backgroundColor: "transparent",
              }}
            >
              {paste.pasteContent}
            </Code>
          </ScrollArea>
        </Paper>
      </Stack>
    </>
  );
};

export default PasteView;
