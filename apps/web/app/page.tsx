"use client";

import { useEffect, useState } from "react";
import { useGetUser, useAuth, useLogin } from "@vassembly/ui-api-hooks";
import styles from "./page.module.css";
import { GraphQLProvider, HttpClientProvider } from "@vassembly/ui-api-hooks";

const Home = () => {
  // const { data } = useGetUser();
  useAuth();
  const { fetch: login } = useLogin();
  useEffect(() => {
    login({ body: { email: "test@test.com", password: "test" } });
  }, []);

  // useEffect(() => {
  //   getUser({ id: "1" });
  // }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        XD
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HttpClientProvider config={{ baseUrl: "http://localhost:5000" }}>
      <GraphQLProvider config={{ endpoint: "http://localhost:5000/graphql" }}>
        <Home />
      </GraphQLProvider>
    </HttpClientProvider>
  );
}