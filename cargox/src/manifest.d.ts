export interface PackageManifest {
    package: {
        name: string;
        version: string;
        entry: string;
    };
    dependencies: Record<string, string>;
}
export declare function readManifest(manifestPath: string): PackageManifest;
export declare function writeManifest(manifestPath: string, manifest: PackageManifest): void;
