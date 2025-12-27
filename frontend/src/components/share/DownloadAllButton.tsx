import { Button } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import toast from "../../utils/toast.util";

const DownloadAllButton = ({ shareId }: { shareId: string }) => {
  const [isZipReady, setIsZipReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const t = useTranslate();

  const downloadAll = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      await shareService.downloadFile(shareId, "zip");
    } catch (e) {
      setHasError(true);
      toast.error(t("share.error.download-failed"));
    } finally {
      setIsLoading(false);
    }
  }, [shareId, t]);

  useEffect(() => {
    shareService
      .getMetaData(shareId)
      .then((share) => setIsZipReady(share.isZipReady))
      .catch(() => {});

    const timer = setInterval(() => {
      shareService
        .getMetaData(shareId)
        .then((share) => {
          setIsZipReady(share.isZipReady);
          if (share.isZipReady) clearInterval(timer);
        })
        .catch(() => clearInterval(timer));
    }, 5000);
    return () => {
      clearInterval(timer);
    };
  }, [shareId]);

  return (
    <Button
      variant="outline"
      loading={isLoading}
      color={hasError ? "red" : undefined}
      onClick={() => {
        if (!isZipReady) {
          toast.error(t("share.notify.download-all-preparing"));
        } else {
          downloadAll();
        }
      }}
    >
      {hasError ? (
        <FormattedMessage id="share.button.download-retry" />
      ) : (
        <FormattedMessage id="share.button.download-all" />
      )}
    </Button>
  );
};

export default DownloadAllButton;
