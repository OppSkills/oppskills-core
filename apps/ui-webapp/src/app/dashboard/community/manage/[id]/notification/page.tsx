import React from "react";
import { SendNotification } from "@/components/common/SendNotification";

export default async function CommunityNotificationPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = params?.id;

  return <SendNotification type="community" id={id} />;
}
