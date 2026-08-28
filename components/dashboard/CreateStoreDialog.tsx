"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCreateStoreMutation } from "@/lib/features/stores/storesApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const createStoreSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters"),
  business_type: z.string().min(1, "Please enter business type"),
  address: z.string().min(5, "Please enter your shop address"),
  gstin: z.string().refine((val) => !val || val.length === 15, {
    message: "GSTIN must be exactly 15 characters",
  }).optional(),
});

type CreateStoreFormData = z.infer<typeof createStoreSchema>;

interface CreateStoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateStoreDialog({ isOpen, onClose, onSuccess }: CreateStoreDialogProps) {
  const [createStore, { isLoading: loading, error: mutationError }] = useCreateStoreMutation();
  const { t } = useLanguage();

  const error = mutationError
    ? (mutationError as any)?.data?.detail || "Failed to create store"
    : null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: "",
      business_type: "Retail",
      address: "",
      gstin: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: CreateStoreFormData) => {
    try {
      await createStore({
        name: data.name,
        business_type: data.business_type,
        address: data.address,
        gstin: data.gstin || undefined,
      }).unwrap();
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Failed to create store:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#151328]/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md scale-100 rounded-2xl border border-[#E4E4F0] bg-white p-6 shadow-xl z-10 transition-transform text-left animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#E4E4F0] pb-4">
          <h2 className="text-lg font-bold text-[#151328]">{t("createStore.title")}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#65637D] hover:bg-[#F7F7FB] transition-colors cursor-pointer outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-danger-bg p-3 border border-danger-text/20">
              <p className="text-xs font-semibold text-danger-text">{error}</p>
            </div>
          )}

          <Input
            label={t("createStore.nameLabel")}
            placeholder={t("createStore.namePlaceholder")}
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label={t("createStore.businessTypeLabel")}
            placeholder={t("createStore.businessTypePlaceholder")}
            error={errors.business_type?.message}
            {...register("business_type")}
          />

          <Input
            label={t("createStore.addressLabel")}
            placeholder={t("createStore.addressPlaceholder")}
            error={errors.address?.message}
            {...register("address")}
          />

          <Input
            label={t("createStore.gstinLabel")}
            placeholder={t("createStore.gstinPlaceholder")}
            error={errors.gstin?.message}
            {...register("gstin")}
            maxLength={15}
          />

          <div className="w-full border-t border-[#E4E4F0] pt-4 mt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="cta"
              size="md"
              className="w-full font-bold cursor-pointer"
            >
              {loading ? t("createStore.submitting") : t("createStore.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
