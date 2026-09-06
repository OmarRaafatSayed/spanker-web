/**
 * /src/modules/visa — public barrel
 * ===================================
 * Import everything visa-related from here.
 */
export { useVisaApplications }                      from "./use-visa-applications";
export { uploadDocument, deleteDocument }           from "./document-upload-service";
export { getMyVisaApplications }                    from "./services/visa-endpoints";
export type { NormalizedVisaApplication }           from "./use-visa-applications";
export type { UploadDocumentParams, UploadResult }  from "./document-upload-service";
