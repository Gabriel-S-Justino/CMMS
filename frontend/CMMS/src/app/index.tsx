// src/app/index.tsx
import { Redirect } from "expo-router";
import { ROUTES } from "@/constants/routes";

export default function Index() {
  return <Redirect href={ROUTES.LOGIN} />;
}