import {
  Accordion,
  Button,
  Checkbox,
  Col,
  Grid,
  Group,
  NumberInput,
  PasswordInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm, yupResolver } from "@mantine/form";
import dayjs, { ManipulateType } from "dayjs";
import duration from "dayjs/plugin/duration";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import * as yup from "yup";
import Meta from "../../components/Meta";
import CopyTextField from "../../components/upload/CopyTextField";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import { Timespan } from "../../types/timespan.type";
import { getExpirationPreview } from "../../utils/date.util";
import toast from "../../utils/toast.util";

dayjs.extend(duration);

const generateShareId = (length: number = 16) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomArray = new Uint8Array(length >= 3 ? length : 3);
  crypto.getRandomValues(randomArray);
  randomArray.forEach((number) => {
    result += chars[number % chars.length];
  });
  return result;
};

const CreateLink = () => {
  const t = useTranslate();
  const config = useConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const maxExpiration: Timespan = config.get("share.maxExpiration");
  const shareIdLength: number = config.get("share.shareIdLength");

  const validationSchema = yup.object().shape({
    link: yup
      .string()
      .required(t("common.error.field-required"))
      .min(3, t("common.error.too-short", { length: 3 }))
      .max(50, t("common.error.too-long", { length: 50 }))
      .matches(new RegExp("^[a-zA-Z0-9_-]*$"), {
        message: t("upload.modal.link.error.invalid"),
      }),
    targetUrl: yup
      .string()
      .required(t("common.error.field-required"))
      .url(t("link.error.invalid-url")),
    name: yup
      .string()
      .transform((value) => value || undefined)
      .min(3, t("common.error.too-short", { length: 3 }))
      .max(30, t("common.error.too-long", { length: 30 })),
    password: yup
      .string()
      .transform((value) => value || undefined)
      .min(3, t("common.error.too-short", { length: 3 }))
      .max(30, t("common.error.too-long", { length: 30 })),
    maxViews: yup
      .number()
      .transform((value) => value || undefined)
      .min(1),
  });

  const form = useForm({
    initialValues: {
      link: generateShareId(shareIdLength),
      targetUrl: "",
      name: undefined as string | undefined,
      description: undefined as string | undefined,
      password: undefined as string | undefined,
      maxViews: undefined as number | undefined,
      expiration_num: 1,
      expiration_unit: "-days",
      never_expires: false,
    },
    validate: yupResolver(validationSchema),
  });

  const onSubmit = form.onSubmit(async (values) => {
    setIsLoading(true);

    try {
      if (!(await shareService.isShareIdAvailable(values.link))) {
        form.setFieldError("link", t("upload.modal.link.error.taken"));
        setIsLoading(false);
        return;
      }

      const expirationString = values.never_expires
        ? "never"
        : values.expiration_num + values.expiration_unit;

      const expirationDate = dayjs().add(
        values.expiration_num,
        values.expiration_unit.replace("-", "") as ManipulateType,
      );

      if (
        maxExpiration.value != 0 &&
        (values.never_expires ||
          expirationDate.isAfter(
            dayjs().add(
              maxExpiration.value,
              maxExpiration.unit as ManipulateType,
            ),
          ))
      ) {
        form.setFieldError(
          "expiration_num",
          t("upload.modal.expires.error.too-long", {
            max: dayjs
              .duration(maxExpiration.value, maxExpiration.unit as ManipulateType)
              .humanize(),
          }),
        );
        setIsLoading(false);
        return;
      }

      await shareService.create({
        id: values.link,
        name: values.name,
        description: values.description,
        expiration: expirationString,
        recipients: [],
        security: {
          password: values.password || undefined,
          maxViews: values.maxViews || undefined,
        },
        shareType: "LINK",
        linkUrl: values.targetUrl,
      });

      setCreatedLink(`${window.location.origin}/api/l/${values.link}`);
      toast.success(t("link.notify.created"));
    } catch (e) {
      toast.axiosError(e);
    } finally {
      setIsLoading(false);
    }
  });

  const createAnother = () => {
    setCreatedLink(null);
    form.reset();
    form.setFieldValue("link", generateShareId(shareIdLength));
  };

  if (createdLink) {
    return (
      <>
        <Meta title={t("link.title")} />
        <Stack spacing="lg">
          <Title order={3}>
            <FormattedMessage id="link.success.title" />
          </Title>
          <Text size="sm" color="dimmed">
            <FormattedMessage id="link.success.description" />
          </Text>
          <CopyTextField link={createdLink} />
          <Button onClick={createAnother}>
            <FormattedMessage id="link.button.create-another" />
          </Button>
        </Stack>
      </>
    );
  }

  return (
    <>
      <Meta title={t("link.title")} />
      <Title order={3} mb="lg">
        <FormattedMessage id="link.title" />
      </Title>

      <form onSubmit={onSubmit}>
        <Stack spacing="md">
          <TextInput
            label={t("link.form.target-url")}
            placeholder="https://example.com"
            required
            {...form.getInputProps("targetUrl")}
          />

          <Group align={form.errors.link ? "center" : "flex-end"}>
            <TextInput
              style={{ flex: "1" }}
              variant="filled"
              label={t("upload.modal.link.label")}
              placeholder="myAwesomeLink"
              {...form.getInputProps("link")}
            />
            <Button
              style={{ flex: "0 0 auto" }}
              variant="outline"
              onClick={() =>
                form.setFieldValue("link", generateShareId(shareIdLength))
              }
            >
              <FormattedMessage id="common.button.generate" />
            </Button>
          </Group>

          <Text
            truncate
            italic
            size="xs"
            sx={(theme) => ({
              color: theme.colors.gray[6],
            })}
          >
            {`${window.location.origin}/api/l/${form.values.link}`}
          </Text>

          <Grid align={form.errors.expiration_num ? "center" : "flex-end"}>
            <Col xs={6}>
              <NumberInput
                min={1}
                max={99999}
                precision={0}
                variant="filled"
                label={t("upload.modal.expires.label")}
                disabled={form.values.never_expires}
                {...form.getInputProps("expiration_num")}
              />
            </Col>
            <Col xs={6}>
              <Select
                disabled={form.values.never_expires}
                {...form.getInputProps("expiration_unit")}
                data={[
                  {
                    value: "-minutes",
                    label:
                      form.values.expiration_num == 1
                        ? t("upload.modal.expires.minute-singular")
                        : t("upload.modal.expires.minute-plural"),
                  },
                  {
                    value: "-hours",
                    label:
                      form.values.expiration_num == 1
                        ? t("upload.modal.expires.hour-singular")
                        : t("upload.modal.expires.hour-plural"),
                  },
                  {
                    value: "-days",
                    label:
                      form.values.expiration_num == 1
                        ? t("upload.modal.expires.day-singular")
                        : t("upload.modal.expires.day-plural"),
                  },
                  {
                    value: "-weeks",
                    label:
                      form.values.expiration_num == 1
                        ? t("upload.modal.expires.week-singular")
                        : t("upload.modal.expires.week-plural"),
                  },
                  {
                    value: "-months",
                    label:
                      form.values.expiration_num == 1
                        ? t("upload.modal.expires.month-singular")
                        : t("upload.modal.expires.month-plural"),
                  },
                  {
                    value: "-years",
                    label:
                      form.values.expiration_num == 1
                        ? t("upload.modal.expires.year-singular")
                        : t("upload.modal.expires.year-plural"),
                  },
                ]}
              />
            </Col>
          </Grid>

          {maxExpiration.value == 0 && (
            <Checkbox
              label={t("upload.modal.expires.never-long")}
              {...form.getInputProps("never_expires")}
            />
          )}

          <Text
            italic
            size="xs"
            sx={(theme) => ({
              color: theme.colors.gray[6],
            })}
          >
            {getExpirationPreview(
              {
                neverExpires: t("upload.modal.completed.never-expires"),
                expiresOn: t("upload.modal.completed.expires-on"),
              },
              form,
            )}
          </Text>

          <Accordion>
            <Accordion.Item value="name-description" sx={{ borderBottom: "none" }}>
              <Accordion.Control>
                <FormattedMessage id="upload.modal.accordion.name-and-description.title" />
              </Accordion.Control>
              <Accordion.Panel>
                <Stack spacing="sm">
                  <TextInput
                    variant="filled"
                    placeholder={t(
                      "upload.modal.accordion.name-and-description.name.placeholder",
                    )}
                    {...form.getInputProps("name")}
                  />
                  <Textarea
                    variant="filled"
                    placeholder={t(
                      "upload.modal.accordion.name-and-description.description.placeholder",
                    )}
                    {...form.getInputProps("description")}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="security" sx={{ borderBottom: "none" }}>
              <Accordion.Control>
                <FormattedMessage id="upload.modal.accordion.security.title" />
              </Accordion.Control>
              <Accordion.Panel>
                <Stack spacing="sm">
                  <PasswordInput
                    variant="filled"
                    placeholder={t(
                      "upload.modal.accordion.security.password.placeholder",
                    )}
                    label={t("upload.modal.accordion.security.password.label")}
                    autoComplete="new-password"
                    {...form.getInputProps("password")}
                  />
                  <NumberInput
                    min={1}
                    type="number"
                    variant="filled"
                    placeholder={t(
                      "upload.modal.accordion.security.max-views.placeholder",
                    )}
                    label={t("upload.modal.accordion.security.max-views.label")}
                    {...form.getInputProps("maxViews")}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          <Button type="submit" loading={isLoading}>
            <FormattedMessage id="link.button.create" />
          </Button>
        </Stack>
      </form>
    </>
  );
};

export default CreateLink;
