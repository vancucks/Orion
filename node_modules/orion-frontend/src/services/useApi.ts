import { useEffect, useState } from "react";
import { apiGet } from "./api";

export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let dataTimer: number | undefined;
    let loadingTimer: number | undefined;

    setLoading(true);
    setError(null);

    apiGet<T>(path)
      .then((response) => {
        if (active) {
          dataTimer = window.setTimeout(() => {
            if (active) setData(response);
          }, 350);
        }
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) {
          loadingTimer = window.setTimeout(() => {
            if (active) setLoading(false);
          }, 350);
        }
      });

    return () => {
      active = false;
      window.clearTimeout(dataTimer);
      window.clearTimeout(loadingTimer);
    };
  }, [path]);

  return { data, loading, error };
}
