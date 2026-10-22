"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const schema = z.object({
  example: z
    .string()
    .trim()
    .min(2, "Use pelo menos dois caracteres.")
    .max(40, "Use até 40 caracteres."),
});
type Values = z.infer<typeof schema>;

/** Non-clinical component example: ephemeral state only, never saved or transmitted. */
export function FormExample() {
  const [validated, setValidated] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { example: "" },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(() => setValidated(true))}
      className="max-w-form space-y-4"
    >
      <div>
        <label htmlFor="example" className="text-sm font-medium">
          Texto de exemplo
        </label>
        <p
          id="example-help"
          className="mt-1 mb-2 text-sm text-muted-foreground"
        >
          Use apenas texto fictício. Nada será salvo ou enviado.
        </p>
        <Input
          id="example"
          {...register("example", { onChange: () => setValidated(false) })}
          aria-invalid={!!errors.example}
          aria-describedby={`example-help${errors.example ? " example-error" : ""}`}
          autoComplete="off"
        />
        {errors.example && (
          <p
            id="example-error"
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {errors.example.message}
          </p>
        )}
      </div>
      <Button type="submit">Validar exemplo</Button>
      <p role="status" className="text-sm text-success-foreground">
        {validated ? "Formato válido. O texto não foi salvo." : ""}
      </p>
    </form>
  );
}
