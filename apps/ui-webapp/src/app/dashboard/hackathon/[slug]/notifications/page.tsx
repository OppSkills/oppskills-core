import React from "react";
import { SendNotification } from "@/components/common/SendNotification";

export default async function NotificationsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const slug = params?.slug;

  return (
    <SendNotification
      type="hackathon"
      slug={slug}
    />
  );
}
