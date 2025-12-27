import {
  ActionIcon,
  Box,
  Code,
  CopyButton,
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
import dayjs from "dayjs";
import { GetServerSidePropsContext } from "next";
import { useEffect, useState } from "react";
import { TbCheck, TbCopy, TbDownload, TbExternalLink } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import useTranslate from "../../hooks/useTranslate.hook";
import api from "../../services/api.service";
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

  const [paste, setPaste] = useState<PasteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/p/${pasteId}`)
      .then((res) => {
        setPaste(res.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.response?.data?.message || t("common.error.unknown"));
        setLoading(false);
      });
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

  if (loading) {
    return (
      <>
        <Meta title={t("paste.view.loading")} />
        <Text>
          <FormattedMessage id="paste.view.loading" />
        </Text>
      </>
    );
  }

  if (error || !paste) {
    return (
      <>
        <Meta title={t("paste.view.error")} />
        <Stack align="center" spacing="md" mt="xl">
          <Title order={3}>
            <FormattedMessage id="paste.view.error" />
          </Title>
          <Text color="dimmed">{error || t("paste.view.not-found")}</Text>
        </Stack>
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
