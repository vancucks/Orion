type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
      <strong className="block text-sm">Erro ao carregar dados</strong>
      <span className="mt-1 block text-sm">{message}</span>
    </div>
  );
}
