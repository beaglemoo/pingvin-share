import {
  Center,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Meta from "../../components/Meta";
import showEnterPasswordModal from "../../components/share/showEnterPasswordModal";
import showErrorModal from "../../components/share/showErrorModal";
import useTranslate from "../../hooks/useTranslate.hook";
import api from "../../services/api.service";
import shareService from "../../services/share.service";
import toast from "../../utils/toast.util";

export function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: { linkId: context.params!.id },
  };
}

const LinkRedirect = ({ linkId }: { linkId: string }) => {
  const t = useTranslate();
  const modals = useModals();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const getShareToken = async (password?: string) => {
    await shareService
      .getShareToken(linkId, password)
      .then(() => {
        modals.closeAll();
        fetchLink();
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

  const fetchLink = async () => {
    api
      .get(`/l/${linkId}`)
      .then((res) => {
        // Redirect to the target URL
        window.location.href = res.data.linkUrl;
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
              t("link.error.not-found.title"),
              t("link.error.not-found.description"),
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
    fetchLink();
  }, [linkId]);

  return (
    <>
      <Meta title={t("link.redirect.title")} />
      <Center style={{ height: "60vh" }}>
        <Stack align="center" spacing="md">
          {loading && (
            <>
              <Loader size="lg" />
              <Text color="dimmed">{t("link.redirect.loading")}</Text>
            </>
          )}
        </Stack>
      </Center>
    </>
  );
};

export default LinkRedirect;
