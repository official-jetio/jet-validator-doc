import type { JetValidator } from "@jetio/validator";

type JVOptions = NonNullable<ConstructorParameters<typeof JetValidator>[0]>;

export type Example = {
  id: string;
  category: string;
  name: string;
  description: string;
  code: string;
  data?: unknown;
  options?: JVOptions;
};

export const STARTER = `const schema = { type: "string", minLength: 3 };

const validate = jet.compile(schema);

console.log("valid:", validate(data));
console.log(validate.errors);
`;

export const examples: Example[] = [
  {
    id: "validate",
    category: "Basics",
    name: "Validate a value",
    description: "Compile a schema and run it against the data on the right.",
    options: { allErrors: true },
    data: { name: "Ada", age: 36, email: "ada@jetio.dev" },
    code: `const schema = {
  type: "object",
  required: ["name", "age"],
  properties: {
    name: { type: "string", minLength: 2 },
    age: { type: "integer", minimum: 0, maximum: 120 },
    email: { type: "string", format: "email" },
  },
};

const validate = jet.compile(schema);

console.log("valid:", validate(data));
console.log(validate.errors);
`,
  },
  {
    id: "all-errors",
    category: "Basics",
    name: "Collect all errors",
    description: "With allErrors on, every failure is reported in one pass.",
    options: { allErrors: true },
    data: { name: "A", age: 200 },
    code: `const schema = {
  type: "object",
  required: ["name", "age"],
  properties: {
    name: { type: "string", minLength: 2 },
    age: { type: "integer", maximum: 120 },
  },
};

const validate = jet.compile(schema);

console.log(validate(data));
console.log(validate.errors);
`,
  },
  {
    id: "compiled-fn",
    category: "Codegen",
    name: "See the compiled function",
    description: "The schema becomes straight-line JavaScript. This is the source.",
    data: [1, 2, 3],
    code: `const schema = { type: "array", items: { type: "integer" }, minItems: 1 };

const validate = jet.compile(schema);

console.log(validate(data));
console.log(validate.toString());
`,
  },
  {
    id: "standalone",
    category: "Codegen",
    name: "Generate a standalone module",
    description: "Emit a zero-runtime module you can write to a file and ship.",
    code: `const schema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
    tags: { type: "array", items: { type: "string" } },
  },
};

const { code, functionName } = jet.generateStandalone(schema, {
  functionName: "validateUser",
});

console.log("// exported as:", functionName);
console.log(code);
`,
  },
  {
    id: "coerce",
    category: "Options",
    name: "Coerce types",
    description: "Strings become numbers and booleans. Watch the input change.",
    options: { coerceTypes: true },
    code: `const schema = {
  type: "object",
  properties: { age: { type: "number" }, active: { type: "boolean" } },
};

const input = { age: "42", active: "true" };
console.log("valid:", jet.compile(schema)(input));
console.log("after:", input);
`,
  },
  {
    id: "defaults",
    category: "Options",
    name: "Fill defaults",
    description: "Missing properties are written from their default value.",
    options: { useDefaults: true },
    code: `const schema = {
  type: "object",
  properties: {
    role: { type: "string", default: "member" },
    active: { type: "boolean", default: true },
  },
};

const input = {};
jet.compile(schema)(input);
console.log(input);
`,
  },
  {
    id: "remove-additional",
    category: "Options",
    name: "Strip extra keys",
    description: "Anything not in the schema is deleted before it returns.",
    options: { removeAdditional: "all" },
    code: `const schema = {
  type: "object",
  properties: { id: { type: "string" }, name: { type: "string" } },
};

const input = { id: "1", name: "Ada", secret: "leak", extra: 99 };
jet.compile(schema)(input);
console.log(input);
`,
  },
  {
    id: "error-message",
    category: "Options",
    name: "Custom messages",
    description: "The schema's own errorMessage replaces the default wording.",
    options: { allErrors: true, errorMessage: true },
    code: `const schema = {
  type: "object",
  required: ["email"],
  properties: {
    email: {
      type: "string",
      format: "email",
      errorMessage: "Enter a valid email address",
    },
  },
};

const validate = jet.compile(schema);
console.log(validate({ email: "not-an-email" }));
console.log(validate.errors);
`,
  },
  {
    id: "custom-format",
    category: "Custom",
    name: "Custom format",
    description: "Register a format with addFormat, then use it like a built-in.",
    options: { allErrors: true },
    code: `jet.addFormat("phone", /^\\+?[1-9]\\d{1,14}$/);

const schema = {
  type: "object",
  required: ["phone"],
  properties: { phone: { type: "string", format: "phone" } },
};

const validate = jet.compile(schema);
console.log(validate({ phone: "+14155550123" }));
console.log(validate({ phone: "nope" }), validate.errors);
`,
  },
  {
    id: "keyword-macro",
    category: "Custom",
    name: "Keyword — macro",
    description: "A macro keyword expands into a sub-schema at compile time.",
    code: `jet.addKeyword({
  keyword: "username",
  macro: () => ({
    type: "string",
    minLength: 3,
    maxLength: 20,
    pattern: "^[a-zA-Z0-9_]+$",
  }),
});

const validate = jet.compile({ username: true });
console.log(validate("ab"), validate.errors);
console.log(validate("ada_dev"));
`,
  },
  {
    id: "keyword-compile",
    category: "Custom",
    name: "Keyword — compile",
    description: "A compile keyword builds a purpose-made function per schema.",
    code: `jet.addKeyword({
  keyword: "divisibleBy",
  compile: (n) => (v) => typeof v !== "number" || v % n === 0,
});

const validate = jet.compile({ type: "number", divisibleBy: 5 });
console.log(validate(12), validate.errors);
console.log(validate(15));
`,
  },
  {
    id: "keyword-validate",
    category: "Custom",
    name: "Keyword — validate",
    description: "A validate keyword runs arbitrary logic. Async-capable too.",
    code: `jet.addKeyword({
  keyword: "even",
  validate: (_schema, v) => typeof v !== "number" || v % 2 === 0,
});

const validate = jet.compile({ type: "number", even: true });
console.log(validate(3), validate.errors);
console.log(validate(4));
`,
  },
  {
    id: "data-ref",
    category: "Advanced",
    name: "$data reference",
    description: "Compare fields at validation time. confirm must equal password.",
    options: { $data: true, allErrors: true },
    code: `const schema = {
  type: "object",
  required: ["password", "confirm"],
  properties: {
    password: { type: "string", minLength: 8 },
    confirm: { const: { $data: "1/password" } },
  },
};

const validate = jet.compile(schema);
console.log(validate({ password: "hunter2!!", confirm: "nope" }), validate.errors);
console.log(validate({ password: "hunter2!!", confirm: "hunter2!!" }));
`,
  },
  {
    id: "elseif",
    category: "Advanced",
    name: "elseIf chain",
    description: "Flat conditional branches instead of nested if/else.",
    options: { allErrors: true },
    code: `const schema = {
  type: "object",
  required: ["accountType"],
  properties: {
    accountType: { enum: ["personal", "business"] },
    username: { type: "string" },
    companyName: { type: "string" },
  },
  if: { properties: { accountType: { const: "personal" } } },
  then: { required: ["username"] },
  elseIf: [
    {
      if: { properties: { accountType: { const: "business" } } },
      then: { required: ["companyName"] },
    },
  ],
};

const validate = jet.compile(schema);
console.log(validate({ accountType: "business" }), validate.errors);
`,
  },
  {
    id: "recursive",
    category: "Advanced",
    name: "Recursive $ref",
    description: "A self-referencing tree. Recursion follows the data, not the schema.",
    code: `const schema = {
  $id: "https://example.com/tree",
  type: "object",
  properties: {
    value: { type: "number" },
    left: { $ref: "#" },
    right: { $ref: "#" },
  },
};

const validate = jet.compile(schema);
console.log(validate({ value: 1, left: { value: 2 }, right: { value: 3, left: { value: 4 } } }));
`,
  },
  {
    id: "schema-builder",
    category: "Companion",
    name: "schema-builder",
    description:
      "Fluent schemas + inferred TS types live in @jetio/schema-builder. Its plain output runs here.",
    code: `// Fluent builder + type inference is a separate package: @jetio/schema-builder
// Install it to run this form (it re-exports JetValidator):
//
//   import { SchemaBuilder, Jet } from "@jetio/schema-builder";
//   const userSchema = new SchemaBuilder().object()
//     .properties({ id: (s) => s.number(), email: (s) => s.string().format("email") })
//     .required(["id", "email"])
//     .build();
//   type User = Jet.Infer<typeof userSchema>;
//
// The plain JSON Schema it produces validates right here:

const userSchema = {
  type: "object",
  required: ["id", "email"],
  properties: {
    id: { type: "number" },
    email: { type: "string", format: "email" },
  },
};

console.log(jet.compile(userSchema)({ id: 1, email: "ada@jetio.dev" }));
`,
  },
];
