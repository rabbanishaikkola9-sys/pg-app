'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Building2, ImagePlus, MapPin } from 'lucide-react';
import { ImageUploader } from '@/components/images/image-uploader';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { PG_FEATURES } from '@/lib/pg-features';

const schema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6),
  totalRooms: z.coerce.number().min(0),
  rentMin: z.coerce.number().min(0),
  rentMax: z.coerce.number().min(0),
  amenities: z.array(z.string()).default([]),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function CreatePropertyPage() {
  const router = useRouter();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      totalRooms: 0,
      rentMin: 0,
      rentMax: 0,
      amenities: [],
      description: '',
      images: [],
    },
  });

  const onSubmit: SubmitHandler<FormOutput> = async (values) => {
    const res = await fetch('/api/pgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        address: values.address,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        totalRooms: values.totalRooms,
        rentRangeMin: values.rentMin,
        rentRangeMax: values.rentMax,
        amenities: values.amenities,
        description: values.description,
        images: values.images,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success('Property created');
      router.push(`/owner/properties/${data.pg.id}`);
    } else {
      toast.error('Failed to create');
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Add a New Property</h1>
          <p className="text-muted-foreground text-sm">List a new PG you manage.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="size-5 text-blue-500" /> Basic Info
              </CardTitle>
              <CardDescription>Name, capacity and price range.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sunrise Nest PG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="totalRooms"
                  render={({ field: { value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Total Rooms</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} value={value as number} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentMin"
                  render={({ field: { value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Rent Min (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} value={value as number} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentMax"
                  render={({ field: { value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Rent Max (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} value={value as number} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Briefly describe this PG..." className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="size-5 text-blue-500" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 MG Road" className="min-h-[60px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Bangalore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Karnataka" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input placeholder="560001" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {PG_FEATURES.map((a) => (
                  <FormField
                    key={a}
                    control={form.control}
                    name="amenities"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(a)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              const updated = checked ? [...current, a] : current.filter((v) => v !== a);
                              field.onChange(updated);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal text-sm">{a}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImagePlus className="size-5 text-blue-500" /> Photos
              </CardTitle>
              <CardDescription>Uploads are compressed and stored as base64 data URLs on the property.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUploader value={field.value ?? []} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-blue-600 px-8 hover:bg-blue-700"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
