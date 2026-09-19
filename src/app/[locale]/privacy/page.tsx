import { getTranslations } from "next-intl/server";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export async function generateMetadata() {
  const t = await getTranslations("Marketing.legal.privacy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: "noindex, nofollow",
  };
}

export default async function PrivacyPolicy() {
  const t = await getTranslations("Marketing.legal.privacy");
  return (
    <LegalLayout title={t("title")} lastUpdated={t("lastUpdated")}>
      {t("body")}
    </LegalLayout>
  );
}
