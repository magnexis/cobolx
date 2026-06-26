#!/usr/bin/env node
import { runCompilerCli } from "./index.js";

process.exit(runCompilerCli(process.argv.slice(2)));
