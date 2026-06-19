"use client";

import { useGlobalForms } from "@/lib/global-forms-context";
import { InvoiceFormSheet } from "@/components/forms/invoice-form-sheet";
import { POFormSheet } from "@/components/forms/po-form-sheet";
import { PaymentFormDialog } from "@/components/forms/payment-form-dialog";
import { VendorFormSheet } from "@/components/forms/vendor-form-sheet";

export function GlobalForms() {
  const { activeForm, prefill, closeForm } = useGlobalForms();

  return (
    <>
      <InvoiceFormSheet
        open={activeForm === "addInvoice"}
        onClose={closeForm}
        prefillPO={prefill.po}
      />
      <InvoiceFormSheet
        open={activeForm === "editInvoice"}
        onClose={closeForm}
        editInvoice={prefill.invoice}
      />
      <POFormSheet
        open={activeForm === "addPO"}
        onClose={closeForm}
      />
      <POFormSheet
        open={activeForm === "editPO"}
        onClose={closeForm}
        editPO={prefill.po}
      />
      <PaymentFormDialog
        open={activeForm === "recordPayment"}
        onClose={closeForm}
        prefillInvoice={prefill.invoice}
      />
      <VendorFormSheet
        open={activeForm === "addVendor"}
        onClose={closeForm}
      />
    </>
  );
}
