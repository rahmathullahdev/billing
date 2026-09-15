import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const dateQuery = searchParams.get('date');
    const today = dateQuery || new Date().toISOString().split('T')[0];

    // 1. Fetch today's bills
    const todayBills = await sanityClient.fetch(
      `*[_type == "bill" && date == $today]`,
      { today }
    );

    // 2. Fetch all machine categories
    const categories = await sanityClient.fetch(`*[_type == "machineCategory" && isActive == true]`);

    if (!todayBills || todayBills.length === 0) {
      const emptyResult = categories.map(cat => ({
        categoryId: cat.categoryId || cat._id,
        categoryName: cat.name,
        totalReadingCount: 0
      }));
      return NextResponse.json({ data: emptyResult });
    }

    // 3. Pre-fetch all particulars and map them
    const particularsList = await sanityClient.fetch(`*[_type == "particular"]`);
    const particularMap = {};
    particularsList.forEach(p => {
      if (p.particularId) particularMap[p.particularId.trim().toLowerCase()] = p;
      if (p._id) particularMap[p._id.trim().toLowerCase()] = p;
    });

    // 4. Pre-fetch all papers and map them
    const papersList = await sanityClient.fetch(`*[_type == "paper"]`);
    const paperMap = {};
    papersList.forEach(p => {
      if (p.paperId) paperMap[p.paperId.trim().toLowerCase()] = p;
      if (p._id) paperMap[p._id.trim().toLowerCase()] = p;
    });

    // 5. Aggregate readings
    const categoryReadingMap = {};

    todayBills.forEach(bill => {
      const jsonParticulars = bill.particularsJson;
      if (!jsonParticulars || jsonParticulars.trim() === '') return;

      try {
        const items = JSON.parse(jsonParticulars);
        
        items.forEach(item => {
          const pIdObj = item.particularId || item.id || item._id;
          if (!pIdObj) return;

          const pIdKey = String(pIdObj).trim().toLowerCase();
          const particular = particularMap[pIdKey];
          if (!particular) return;

          let qty = 0;
          if (item.qty !== undefined) {
            qty = Number(item.qty);
          } else if (item.quantity !== undefined) {
            qty = Number(item.quantity);
          }

          if (qty <= 0) return;

          const paperId = particular.paperId || particular._id;
          if (paperId && paperId.trim() !== '') {
            const paper = paperMap[paperId.trim().toLowerCase()];
            if (paper && Number(paper.readingCount) > 0) {
              const itemReading = Math.round(qty * Number(paper.readingCount));

              const machineCategoryId = particular.machineCategoryId || particular.machineCategory;
              const machineCategory = particular.machineCategory;

              if (machineCategoryId && machineCategoryId.trim() !== '') {
                const key = machineCategoryId.trim();
                categoryReadingMap[key] = (categoryReadingMap[key] || 0) + itemReading;
              }
              if (machineCategory && machineCategory.trim() !== '') {
                const key = machineCategory.trim().toLowerCase();
                categoryReadingMap[key] = (categoryReadingMap[key] || 0) + itemReading;
              }
            }
          }
        });
      } catch (e) {
        // Ignore malformed JSON
      }
    });

    // 6. Build final response list
    const result = categories.map(cat => {
      const catId = cat.categoryId;
      const catSanityId = cat._id;
      const catName = cat.name ? cat.name.trim().toLowerCase() : null;

      const countByCatId = catId ? (categoryReadingMap[catId] || 0) : 0;
      const countBySanityId = catSanityId ? (categoryReadingMap[catSanityId] || 0) : 0;
      const countByName = catName ? (categoryReadingMap[catName] || 0) : 0;

      const totalReadingCount = Math.max(countByCatId, countBySanityId, countByName);

      return {
        categoryId: cat.categoryId || cat._id,
        categoryName: cat.name,
        totalReadingCount
      };
    });

    return NextResponse.json({ data: result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
