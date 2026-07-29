import { EvmUseCases } from "@/application/evm-use-cases";
import { createDatabase } from "@/infrastructure/database/client";
import { DrizzleEvmRepository } from "@/infrastructure/database/drizzle-evm-repository";

let useCases: EvmUseCases | undefined;

export function getEvmUseCases(): EvmUseCases {
  if (!useCases) {
    const { db } = createDatabase();
    useCases = new EvmUseCases(new DrizzleEvmRepository(db));
  }

  return useCases;
}
