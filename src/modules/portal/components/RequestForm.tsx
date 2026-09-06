"use client"

// =============================================================================
// RequestForm — create or edit a travel request
// =============================================================================

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"
import { Label }   from "@/components/ui/label"
import { cn }      from "@/lib/utils"
import type { CreateRequestBody, RequestResponse, RequestType } from "@/modules/portal/types/portal.types"

const REQUEST_TYPES: { value: RequestType; label: string }[] = [
  { value: "visa",    label: "✈️  Visa Application" },
  { value: "flight",  label: "🛫  Flight Booking" },
  { value: "hotel",   label: "🏨  Hotel Booking" },
  { value: "package", label: "📦  Full Package" },
]

// num_travelers stored as a string in the form, converted to number on submit
const schema = z.object({
  full_name:     z.string().min(2, "Full name is required"),
  request_type:  z.enum(["visa", "flight", "hotel", "package"]),
  destination:   z.string().min(2, "Destination is required"),
  travel_date:   z.string().optional(),
  return_date:   z.string().optional(),
  num_travelers: z.string().optional(),
  phone:         z.string().optional(),
  notes:         z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface RequestFormProps {
  defaultValues?: Partial<RequestResponse>
  onSubmit: (body: CreateRequestBody) => Promise<void>
  isLoading?: boolean
  error?: string | null
  submitLabel?: string
}

export function RequestForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  error,
  submitLabel = "Submit Request",
}: RequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name:     defaultValues?.full_name     ?? "",
      request_type:  defaultValues?.request_type  ?? "visa",
      destination:   defaultValues?.destination   ?? "",
      travel_date:   defaultValues?.travel_date   ?? "",
      return_date:   defaultValues?.return_date   ?? "",
      num_travelers: String(defaultValues?.num_travelers ?? "1"),
      phone:         defaultValues?.phone         ?? "",
      notes:         defaultValues?.notes         ?? "",
    },
  })

  const submit = async (values: FormValues) => {
    const num = parseInt(values.num_travelers ?? "1", 10)
    await onSubmit({
      full_name:     values.full_name,
      request_type:  values.request_type,
      destination:   values.destination,
      travel_date:   values.travel_date,
      return_date:   values.return_date,
      num_travelers: isNaN(num) ? 1 : num,
      phone:         values.phone,
      notes:         values.notes,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" placeholder="John Doe" className={cn(errors.full_name && "border-red-400")} {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-red-600">{errors.full_name.message}</p>}
      </div>

      {/* Request type */}
      <div className="space-y-1.5">
        <Label htmlFor="request_type">Request type</Label>
        <select
          id="request_type"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            errors.request_type && "border-red-400"
          )}
          {...register("request_type")}
        >
          {REQUEST_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Destination */}
      <div className="space-y-1.5">
        <Label htmlFor="destination">Destination</Label>
        <Input id="destination" placeholder="e.g. Egypt, Hurghada" className={cn(errors.destination && "border-red-400")} {...register("destination")} />
        {errors.destination && <p className="text-xs text-red-600">{errors.destination.message}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="travel_date">Travel date</Label>
          <Input id="travel_date" type="date" {...register("travel_date")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="return_date">Return date</Label>
          <Input id="return_date" type="date" {...register("return_date")} />
        </div>
      </div>

      {/* Travelers + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="num_travelers">Travelers</Label>
          <Input id="num_travelers" type="number" min={1} max={50} {...register("num_travelers")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="req_phone">Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="req_phone" type="tel" placeholder="+20 100…" {...register("phone")} />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Any special requirements, visa history, budget…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          {...register("notes")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
        ) : submitLabel}
      </Button>
    </form>
  )
}
