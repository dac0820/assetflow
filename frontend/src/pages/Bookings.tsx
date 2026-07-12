import React, { useState } from "react";
import { Clock, Plus, Loader2, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { bookingsService, assetService } from "../services/dataService";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";

const bookingFormSchema = z.object({
  asset_id: z.string().min(1, "Please select a valid Asset"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
});

type BookingFormFields = z.infer<typeof bookingFormSchema>;

export const Bookings: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [showWizard, setShowWizard] = useState(false);

  const mockBookings = [
    { id: "1", assetName: "HQ Boardroom Projector", user: "Michael Davis", start: "10:00 AM", end: "12:30 PM", date: "Today" },
    { id: "2", assetName: "Conference Speakerphone", user: "Sarah Connor", start: "02:00 PM", end: "03:00 PM", date: "Today" },
  ];

  const { data: dbBookings, isLoading } = useQuery({
    queryKey: ["bookingsList"],
    queryFn: () => bookingsService.getBookings(),
  });

  const { data: dbAssets } = useQuery({
    queryKey: ["assetsListForBooking"],
    queryFn: () => assetService.getAssets(),
  });

  const availableResources = dbAssets && dbAssets.length > 0
    ? dbAssets.filter(asset => asset.status === "available")
    : [
        { id: "550e8400-e29b-41d4-a716-446655440000", name: "HQ Boardroom Projector" },
        { id: "550e8400-e29b-41d4-a716-446655440001", name: "Conference Speakerphone" },
        { id: "550e8400-e29b-41d4-a716-446655440002", name: "Dell UltraSharp 32 Monitor" }
      ];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookingFormFields>({
    resolver: zodResolver(bookingFormSchema),
  });

  const createMutation = useMutation({
    mutationFn: (payload: BookingFormFields) =>
      bookingsService.createBooking({
        ...payload,
        employee_id: "c1a60fae-e2c7-4ebc-8854-3252199b0c20", // Mock employee ID
      }),
    onSuccess: () => {
      toast.success("Booking registered successfully!");
      setShowWizard(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["bookingsList"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Scheduling conflict. Slot already occupied.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsService.cancelBooking(id),
    onSuccess: () => {
      toast.success("Reservation cancelled.");
      queryClient.invalidateQueries({ queryKey: ["bookingsList"] });
    },
  });

  const onSubmit = (data: BookingFormFields) => {
    createMutation.mutate(data);
  };

  const scheduleList = dbBookings && dbBookings.length > 0
    ? dbBookings.map((b) => {
        const matchingAsset = dbAssets?.find(a => a.id === b.asset_id);
        return {
          id: b.id,
          assetName: matchingAsset ? matchingAsset.name : "Shared Asset",
          user: "Employee Custodian",
          start: new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          end: new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(b.start_time).toLocaleDateString(),
          status: b.status,
        };
      })
    : mockBookings.map(b => ({ ...b, status: "approved" }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">Temporary reservations calendar for shared workspace devices</p>
        </div>
        {(user?.role === "admin" || user?.role === "manager") && (
          <button
            onClick={() => setShowWizard(!showWizard)}
            className="py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Reservation</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wizard Form/Sidebar */}
        {showWizard && (user?.role === "admin" || user?.role === "manager") && (
          <div className="lg:col-span-1 p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-lg">Schedule Wizard</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Available Resource</label>
                <select
                  {...register("asset_id")}
                  className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">-- Choose Resource --</option>
                  {availableResources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name}
                    </option>
                  ))}
                </select>
                {errors.asset_id && <p className="text-xs text-red-500 mt-1">{errors.asset_id.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Start Time</label>
                <input
                  {...register("start_time")}
                  type="datetime-local"
                  style={{ colorScheme: "dark" }}
                  className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
                {errors.start_time && <p className="text-xs text-red-500 mt-1">{errors.start_time.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">End Time</label>
                <input
                  {...register("end_time")}
                  type="datetime-local"
                  style={{ colorScheme: "dark" }}
                  className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
                {errors.end_time && <p className="text-xs text-red-500 mt-1">{errors.end_time.message}</p>}
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Book Slot</span>
              </button>
            </form>
          </div>
        )}

        {/* Schedule list */}
        <div className={showWizard ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Active Reservations</span>
              </h3>
              <div className="space-y-3">
                {scheduleList.map((booking) => (
                  <div key={booking.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{booking.assetName}</p>
                        <p className="text-xs text-muted-foreground">Reserved by {booking.user} • {booking.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-muted">
                        {booking.start} - {booking.end}
                      </span>
                      {booking.status === "approved" && (user?.role === "admin" || user?.role === "manager") && (
                        <button
                          onClick={() => cancelMutation.mutate(booking.id)}
                          className="text-xs text-red-500 hover:underline px-2 py-1"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

