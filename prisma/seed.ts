// FILE: prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminEmail = "admin@basepoint.com";
  const adminPassword = "Admin123!"; // CHANGE THIS IN PRODUCTION

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists");
  } else {
    const hashedPassword = await hashPassword(adminPassword);

    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Admin User",
        role: "admin",
      },
    });

    console.log("Admin user created:", admin.email);
    console.log("Password:", adminPassword);
  }

  // Create sample products
  console.log("\nCreating sample products...");

  const product1 = await prisma.product.upsert({
    where: { slug: "mid-range-spreader-bars" },
    update: {},
    create: {
      title: "Mid Range Spreader Bars",
      slug: "mid-range-spreader-bars",
      description:
        "Welcome to the mid capacity spread bar sections. Here you will find digital drawings for spreader bars ranging from 6-30ft fully extended and capacity range from 7.5-30ton. These drawings come with everything you need to manufacture the bar including stamped drawings, part drawings and welding details.",
      basePrice: 600.0,
      imageUrl: "https://placehold.co/600x400?text=Spreader+Bar",
      category: "Spreader Bars",
      variants: {
        create: [
          {
            sku: "MSB-7.5-6-CL",
            capacity: "7.5ton",
            length: "6ft",
            endConnectionStyle: "Clearance Lug",
            price: 600.0,
            stock: 10,
          },
          {
            sku: "MSB-10-10-CL",
            capacity: "10ton",
            length: "10ft",
            endConnectionStyle: "Clearance Lug",
            price: 750.0,
            stock: 8,
          },
          {
            sku: "MSB-15-15-DL",
            capacity: "15ton",
            length: "15ft",
            endConnectionStyle: "Double Lug",
            price: 900.0,
            stock: 5,
          },
          {
            sku: "MSB-20-20-SL",
            capacity: "20ton",
            length: "20ft",
            endConnectionStyle: "Swivel Lug",
            price: 1100.0,
            stock: 6,
          },
        ],
      },
    },
  });

  console.log("Created product:", product1.title);

  const product2 = await prisma.product.upsert({
    where: { slug: "heavy-duty-lifting-beams" },
    update: {},
    create: {
      title: "Heavy Duty Lifting Beams",
      slug: "heavy-duty-lifting-beams",
      description:
        "Professional-grade lifting beams designed for heavy-duty industrial applications. Engineered to meet the highest safety standards with capacity ratings from 10 to 50 tons.",
      basePrice: 1200.0,
      imageUrl: "https://placehold.co/600x400?text=Lifting+Beam",
      category: "Lifting Equipment",
      variants: {
        create: [
          {
            sku: "LB-10-8-CL",
            capacity: "10ton",
            length: "8ft",
            endConnectionStyle: "Clearance Lug",
            price: 1200.0,
            stock: 4,
          },
          {
            sku: "LB-25-12-DL",
            capacity: "25ton",
            length: "12ft",
            endConnectionStyle: "Double Lug",
            price: 1800.0,
            stock: 3,
          },
          {
            sku: "LB-50-16-SL",
            capacity: "50ton",
            length: "16ft",
            endConnectionStyle: "Swivel Lug",
            price: 2500.0,
            stock: 2,
          },
        ],
      },
    },
  });

  console.log("Created product:", product2.title);

  // Create sample blogs
  console.log("\nCreating sample blogs...");

  const blog1 = await prisma.blog.upsert({
    where: { slug: "spreader-bar-safety-guide" },
    update: {},
    create: {
      title: "Comprehensive Spreader Bar Safety Guide",
      slug: "spreader-bar-safety-guide",
      content: `Spreader bars are essential tools in lifting operations, but they require proper understanding and handling to ensure safety.

## Understanding Spreader Bars

A spreader bar is a lifting device that separates sling legs to improve load stability and reduce the crushing force on the load. They're commonly used in construction, manufacturing, and shipping industries.

## Key Safety Considerations

1. **Load Capacity**: Never exceed the rated capacity of your spreader bar. Always check the manufacturer's specifications.

2. **Inspection**: Before each use, inspect the spreader bar for cracks, deformations, or wear. Pay special attention to welds and connection points.

3. **Proper Rigging**: Ensure slings are properly attached and positioned. The angle of the sling affects the load on the spreader bar.

4. **Environmental Factors**: Consider wind, temperature, and other environmental conditions that might affect the lift.

## Best Practices

- Always use qualified riggers
- Document all inspections
- Follow manufacturer guidelines
- Train all personnel involved in lifting operations
- Maintain proper certification and documentation

## Conclusion

Safety should always be the top priority when working with lifting equipment. Regular training, proper inspection protocols, and adherence to safety standards will help prevent accidents and ensure successful operations.`,
      excerpt:
        "Learn essential safety practices for using spreader bars in lifting operations. A comprehensive guide covering inspection, capacity, and best practices.",
      imageUrl: "https://placehold.co/800x400?text=Safety+Guide",
      author: "John Smith",
      publishedAt: new Date("2024-01-15"),
    },
  });

  console.log("Created blog:", blog1.title);

  const blog2 = await prisma.blog.upsert({
    where: { slug: "choosing-right-lifting-equipment" },
    update: {},
    create: {
      title: "How to Choose the Right Lifting Equipment",
      slug: "choosing-right-lifting-equipment",
      content: `Selecting the appropriate lifting equipment is crucial for safety and efficiency in any industrial operation.

## Assess Your Needs

Start by evaluating:
- Maximum load weight
- Load dimensions and shape
- Lifting height requirements
- Frequency of use
- Environmental conditions

## Types of Lifting Equipment

### Spreader Bars
Ideal for long, flexible loads or when you need to reduce sling angles. Best for loads that need to remain level during lifting.

### Lifting Beams
More compact than spreader bars and better for shorter loads. Easier to store and transport.

### Adjustable Options
Consider adjustable equipment if you work with varying load sizes. While more expensive initially, they offer greater versatility.

## Capacity Considerations

Always calculate the total system capacity, including:
- Weight of the load
- Weight of rigging equipment
- Dynamic forces during lifting
- Safety factor (typically 5:1)

## Quality and Certification

Look for equipment that meets or exceeds:
- ASME B30.20 standards
- OSHA requirements
- Manufacturer certifications

Invest in quality equipment from reputable manufacturers. Cheaper alternatives may compromise safety and durability.

## Maintenance Requirements

Consider the maintenance needs:
- Inspection frequency
- Availability of replacement parts
- Repair capabilities
- Storage requirements

## Conclusion

Choosing the right lifting equipment requires careful consideration of multiple factors. When in doubt, consult with lifting equipment specialists and certified engineers to ensure you select the best solution for your specific needs.`,
      excerpt:
        "A practical guide to selecting the most appropriate lifting equipment for your industrial operations, covering capacity, types, and safety considerations.",
      imageUrl: "https://placehold.co/800x400?text=Equipment+Selection",
      author: "Sarah Johnson",
      publishedAt: new Date("2024-02-20"),
    },
  });

  console.log("Created blog:", blog2.title);

  const blog3 = await prisma.blog.upsert({
    where: { slug: "maintenance-tips-lifting-equipment" },
    update: {},
    create: {
      title: "Essential Maintenance Tips for Lifting Equipment",
      slug: "maintenance-tips-lifting-equipment",
      content: `Proper maintenance of lifting equipment is not just about compliance—it's about safety and longevity.

## Daily Inspection Checklist

Before each use, check for:
- Visible cracks or deformations
- Wear on lifting points
- Loose or damaged hardware
- Proper labeling and capacity markings
- Corrosion or rust
- Damaged welds

## Monthly Deep Inspection

Conduct more thorough monthly inspections:
- Measure critical dimensions
- Check for hidden damage
- Test all moving parts
- Verify load capacity markings
- Review documentation

## Annual Certification

Professional inspection and certification should include:
- Load testing
- Non-destructive testing (NDT)
- Complete documentation update
- Recertification as needed

## Common Maintenance Issues

### Corrosion
Regular cleaning and protective coatings can prevent rust. Store equipment in dry conditions when possible.

### Wear Points
Monitor high-stress areas closely. Replace components showing significant wear before failure occurs.

### Documentation
Maintain detailed records of all inspections, repairs, and certifications. This creates a maintenance history that can identify patterns and prevent failures.

## Storage Best Practices

- Store in dry, covered areas
- Keep off the ground
- Protect from chemicals and contaminants
- Organize by size and capacity
- Maintain clear identification

## When to Replace

Don't try to extend the life of damaged equipment. Replace when:
- Cracks are present
- Deformation exceeds manufacturer limits
- Corrosion is significant
- Equipment is approaching or past its service life

## Training

Ensure all operators and inspectors are properly trained on:
- Equipment capabilities and limitations
- Inspection procedures
- Documentation requirements
- Emergency procedures

## Conclusion

A comprehensive maintenance program protects your investment and, more importantly, the safety of your workers. Regular inspections, proper storage, and timely repairs will extend equipment life and prevent accidents.`,
      excerpt:
        "Keep your lifting equipment in top condition with these essential maintenance tips. Learn about inspection schedules, common issues, and best practices.",
      imageUrl: "https://placehold.co/800x400?text=Maintenance+Guide",
      author: "Mike Peterson",
      publishedAt: new Date("2024-03-10"),
    },
  });

  console.log("Created blog:", blog3.title);

  console.log("\n✅ Seeding completed successfully!");
  console.log("\nSummary:");
  console.log("- Admin user: admin@basepoint.com / Admin123!");
  console.log("- Products created: 2");
  console.log("- Product variants: 7");
  console.log("- Blogs created: 3");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
