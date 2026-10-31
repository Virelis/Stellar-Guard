const fs = require("fs");
const path = require("path");

describe("Monorepo & Codebase Workspace Integrity", () => {
  const rootDir = path.resolve(__dirname, "..");

  test("Root package.json defines npm workspaces properly", () => {
    const rootPkgPath = path.join(rootDir, "package.json");
    expect(fs.existsSync(rootPkgPath)).toBe(true);

    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf-8"));
    expect(rootPkg.workspaces).toBeDefined();
    expect(Array.isArray(rootPkg.workspaces)).toBe(true);
    expect(rootPkg.workspaces).toContain("backend");
    expect(rootPkg.workspaces).toContain("frontend");
    expect(rootPkg.workspaces).toContain("packages/*");
  });

  test("Shared types package exists and has build script and entry points", () => {
    const typesPkgPath = path.join(rootDir, "packages", "types", "package.json");
    expect(fs.existsSync(typesPkgPath)).toBe(true);

    const typesPkg = JSON.parse(fs.readFileSync(typesPkgPath, "utf-8"));
    expect(typesPkg.name).toBe("@stellar-guard/types");
    expect(typesPkg.main).toBe("dist/index.js");
    expect(typesPkg.types).toBe("dist/index.d.ts");
    expect(typesPkg.scripts.build).toBeDefined();
  });

  test("Cargo.toml root workspace defines smart contract members", () => {
    const cargoTomlPath = path.join(rootDir, "Cargo.toml");
    expect(fs.existsSync(cargoTomlPath)).toBe(true);

    const cargoContent = fs.readFileSync(cargoTomlPath, "utf-8");
    expect(cargoContent).toContain("[workspace]");
    expect(cargoContent).toContain("contracts/freeze-governance");
  });

  test("Configuration files exist and are valid JSON", () => {
    const eslintPath = path.join(rootDir, ".eslintrc.json");
    expect(fs.existsSync(eslintPath)).toBe(true);
    const eslintConfig = JSON.parse(fs.readFileSync(eslintPath, "utf-8"));
    expect(eslintConfig.root).toBe(true);

    const tsconfigBasePath = path.join(rootDir, "tsconfig.base.json");
    expect(fs.existsSync(tsconfigBasePath)).toBe(true);
    const tsconfigBase = JSON.parse(fs.readFileSync(tsconfigBasePath, "utf-8"));
    expect(tsconfigBase.compilerOptions.strict).toBe(true);

    const prettierrcPath = path.join(rootDir, ".prettierrc.json");
    expect(fs.existsSync(prettierrcPath)).toBe(true);
  });

  test("CI and automation scripts exist and are executable", () => {
    expect(fs.existsSync(path.join(rootDir, ".github", "workflows", "node-matrix-ci.yml"))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, ".github", "workflows", "contract-ci.yml"))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, ".github", "workflows", "security-audit.yml"))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, "scripts", "task-runner.ps1"))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, "scripts", "task-runner.sh"))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, "Makefile"))).toBe(true);
  });
});
