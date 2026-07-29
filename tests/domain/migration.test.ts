import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const migrationPath = "drizzle/0000_phase_0.sql";

type ColumnShape = {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
};

function createTableStatements(sql: string): string[] {
  return sql.match(/create\s+table\s+"[^"]+"\s*\([\s\S]*?\);/gi) ?? [];
}

function tableStatement(statements: string[], tableName: string): string {
  const statement = statements.find((candidate) =>
    new RegExp(`create\\s+table\\s+"${tableName}"\\s*\\(`, "i").test(candidate),
  );
  assert.ok(statement, `missing CREATE TABLE for ${tableName}`);
  return statement;
}

function columnsFrom(statement: string): ColumnShape[] {
  const body = statement.slice(statement.indexOf("(") + 1, statement.lastIndexOf(")"));
  return body
    .split(",\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith('"'))
    .map((line) => {
      const match = line.match(
        /^"([^"]+)"\s+(serial|integer|text|date|numeric\(\s*\d+\s*,\s*\d+\s*\))(.*)$/i,
      );
      assert.ok(match, `unrecognized generated column declaration: ${line}`);
      return {
        name: match[1],
        type: match[2].replace(/\s+/g, "").toLowerCase(),
        notNull: /\bnot\s+null\b/i.test(match[3]),
        primaryKey: /\bprimary\s+key\b/i.test(match[3]),
      };
    });
}

test("migration persists only the approved project and activity columns", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const statements = createTableStatements(sql);

  assert.equal(
    (sql.match(/\bcreate\s+table\b/gi) ?? []).length,
    2,
    "migration must contain exactly two CREATE TABLE statements",
  );
  assert.equal(statements.length, 2, "migration must create exactly two tables");

  assert.deepEqual(columnsFrom(tableStatement(statements, "projects")), [
    { name: "id", type: "serial", notNull: true, primaryKey: true },
    { name: "name", type: "text", notNull: true, primaryKey: false },
    { name: "cutoff_date", type: "date", notNull: true, primaryKey: false },
  ]);

  assert.deepEqual(columnsFrom(tableStatement(statements, "activities")), [
    { name: "id", type: "serial", notNull: true, primaryKey: true },
    { name: "project_id", type: "integer", notNull: true, primaryKey: false },
    { name: "name", type: "text", notNull: true, primaryKey: false },
    { name: "bac", type: "numeric(38,18)", notNull: true, primaryKey: false },
    {
      name: "planned_progress",
      type: "numeric(38,18)",
      notNull: true,
      primaryKey: false,
    },
    {
      name: "actual_progress",
      type: "numeric(38,18)",
      notNull: true,
      primaryKey: false,
    },
    { name: "ac", type: "numeric(38,18)", notNull: true, primaryKey: false },
  ]);
});

test("migration declares exactly four exact numeric activity columns", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const activitiesStatement = tableStatement(createTableStatements(sql), "activities");
  const numericColumns = columnsFrom(activitiesStatement).filter((column) =>
    column.type.startsWith("numeric("),
  );

  assert.deepEqual(
    numericColumns.map(({ name, type }) => ({ name, type })),
    [
      { name: "bac", type: "numeric(38,18)" },
      { name: "planned_progress", type: "numeric(38,18)" },
      { name: "actual_progress", type: "numeric(38,18)" },
      { name: "ac", type: "numeric(38,18)" },
    ],
  );
  assert.doesNotMatch(sql, /\b(?:real|double\s+precision)\b/i);
});

test("migration delegates activity deletion to the PostgreSQL foreign key", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(
    sql,
    /foreign\s+key\s*\(\s*"project_id"\s*\)\s+references\s+"(?:public)"\."projects"\s*\(\s*"id"\s*\)\s+on\s+delete\s+cascade\b/i,
  );
});

test("migration contains no derived, historical, or activity-cutoff columns", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const statements = createTableStatements(sql);
  const allColumnNames = statements.flatMap(columnsFrom).map((column) => column.name);
  const activityColumnNames = columnsFrom(
    tableStatement(statements, "activities"),
  ).map((column) => column.name);
  const forbiddenColumns = new Set([
    "pv",
    "ev",
    "cv",
    "sv",
    "cpi",
    "spi",
    "eac",
    "vac",
    "interpretation",
    "status",
    "consolidated",
    "history",
    "historical",
    "version",
  ]);

  assert.deepEqual(
    allColumnNames.filter((columnName) => forbiddenColumns.has(columnName)),
    [],
  );
  assert.equal(activityColumnNames.includes("cutoff_date"), false);
});
