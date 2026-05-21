import React, { Suspense } from "react";
import RegistrationPage from "./main";

export default function page() {
  return (
    <Suspense fallback={<p>Loading .....</p>}>
      <RegistrationPage />
    </Suspense>
  );
}
