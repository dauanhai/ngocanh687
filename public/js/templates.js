// Content Templates for Đậu Ánh Facebook Marketing
const ContentTemplates = {
  categories: [
    {
      id: 'sales',
      name: '🛒 Bán hàng',
      icon: '🛒',
      templates: [
        {
          name: 'Giới thiệu sản phẩm',
          content: '🫘 ĐẬU ÁNH - [Tên sản phẩm]\n\n✨ Đặc điểm nổi bật:\n✅ [Đặc điểm 1]\n✅ [Đặc điểm 2]\n✅ [Đặc điểm 3]\n\n💰 Giá chỉ: [Giá]\n📦 Miễn phí giao hàng cho đơn từ 500K\n\n👉 Đặt hàng ngay: [Link]\n📞 Hotline: [SĐT]\n\n#ĐậuÁnh #SảnPhẩmChấtLượng #MuaSắmOnline'
        },
        {
          name: 'Flash Sale',
          content: '⚡ FLASH SALE - CHỈ HÔM NAY! ⚡\n\n🔥 Giảm giá [XX]% cho tất cả sản phẩm Đậu Ánh!\n\n⏰ Thời gian: [Giờ bắt đầu] - [Giờ kết thúc]\n💥 Số lượng có hạn - Nhanh tay kẻo hết!\n\n🛒 Mua ngay tại: [Link]\n\n#FlashSale #ĐậuÁnh #GiảmGiá #KhuyếnMãi'
        },
        {
          name: 'Combo ưu đãi',
          content: '🎁 COMBO SIÊU ƯU ĐÃI TỪ ĐẬU ÁNH 🎁\n\n📦 Combo bao gồm:\n1️⃣ [Sản phẩm 1]\n2️⃣ [Sản phẩm 2]\n3️⃣ [Sản phẩm 3]\n\n💰 Giá gốc: [Giá gốc]\n🔥 Giá combo: [Giá combo] (Tiết kiệm [XX]%)\n\n📞 Đặt hàng: [SĐT]\n🏪 Hoặc ghé cửa hàng: [Địa chỉ]\n\n#ĐậuÁnh #ComboƯuĐãi #TiếtKiệm'
        }
      ]
    },
    {
      id: 'engagement',
      name: '💬 Tương tác',
      icon: '💬',
      templates: [
        {
          name: 'Câu hỏi tương tác',
          content: '🤔 HỎI NHANH - ĐÁP NHANH!\n\n[Câu hỏi liên quan đến sản phẩm/ngành hàng]?\n\nA. [Đáp án 1]\nB. [Đáp án 2]\nC. [Đáp án 3]\n\n👇 Comment đáp án của bạn bên dưới nhé!\n💝 3 bạn trả lời đúng sẽ nhận quà từ Đậu Ánh\n\n#ĐậuÁnh #MiniGame #TươngTác'
        },
        {
          name: 'Đánh giá khách hàng',
          content: '⭐⭐⭐⭐⭐ CẢM ƠN KHÁCH HÀNG!\n\n💬 "[Nội dung đánh giá từ khách hàng]"\n— [Tên khách hàng], [Địa điểm]\n\nCảm ơn [Tên] đã tin tưởng và ủng hộ Đậu Ánh! 🙏\n\n💡 Bạn cũng muốn trải nghiệm? Đặt hàng ngay:\n👉 [Link]\n\n#ĐậuÁnh #ReviewKháchHàng #ChấtLượng'
        },
        {
          name: 'Mini Game',
          content: '🎮 MINI GAME - TRÚNG QUÀ LIỀN TAY! 🎁\n\n📜 Luật chơi:\n1️⃣ Like bài viết này ❤️\n2️⃣ Share bài viết 📢\n3️⃣ Comment: "[Keyword]" + tag 2 người bạn\n\n🏆 Giải thưởng:\n🥇 [Giải nhất]\n🥈 [Giải nhì]\n🥉 [Giải ba]\n\n⏰ Thời gian: [Ngày bắt đầu] - [Ngày kết thúc]\n📢 Công bố kết quả: [Ngày]\n\n#ĐậuÁnh #MiniGame #TrúngQuà'
        }
      ]
    },
    {
      id: 'branding',
      name: '🌟 Thương hiệu',
      icon: '🌟',
      templates: [
        {
          name: 'Câu chuyện thương hiệu',
          content: '📖 CÂU CHUYỆN ĐẬU ÁNH\n\n[Đoạn mở đầu thu hút - kể về nguồn gốc/cảm hứng]\n\n💫 Chúng tôi tin rằng [Giá trị cốt lõi]...\n\n🌱 Từ [năm thành lập], Đậu Ánh đã [thành tựu/hành trình]...\n\n❤️ Mỗi sản phẩm đều được [quy trình/cam kết]...\n\n👉 Tìm hiểu thêm: [Link]\n\n#ĐậuÁnh #CâuChuyệnThươngHiệu #ChấtLượng'
        },
        {
          name: 'Behind the scenes',
          content: '🎬 HẬU TRƯỜNG SẢN XUẤT ĐẬU ÁNH\n\nBạn có tò mò sản phẩm của chúng tôi được tạo ra như thế nào không? 🤔\n\n📸 Hôm nay, hãy cùng ghé thăm [nơi sản xuất/văn phòng]!\n\n✅ [Bước 1 trong quy trình]\n✅ [Bước 2]\n✅ [Bước 3]\n\n💯 Mỗi sản phẩm đều được kiểm tra [XX] lần trước khi đến tay bạn!\n\n#ĐậuÁnh #HậuTrường #ChấtLượng #BehindTheScenes'
        }
      ]
    },
    {
      id: 'seasonal',
      name: '🎉 Theo mùa/Sự kiện',
      icon: '🎉',
      templates: [
        {
          name: 'Chúc mừng ngày lễ',
          content: '🎊 [TÊN NGÀY LỄ] VUI VẺ! 🎊\n\nĐậu Ánh xin gửi lời chúc [lời chúc phù hợp] đến quý khách hàng! 🙏\n\n🎁 Nhân dịp này, chúng tôi dành tặng:\n✨ [Ưu đãi 1]\n✨ [Ưu đãi 2]\n\n⏰ Áp dụng: [Thời gian]\n🛒 Mua ngay: [Link]\n\n#ĐậuÁnh #[HashtagNgàyLễ] #ƯuĐãi'
        },
        {
          name: 'Tri ân khách hàng',
          content: '💝 TRI ÂN KHÁCH HÀNG - [Dịp/Cột mốc] 💝\n\n🙏 Cảm ơn [số lượng] khách hàng đã đồng hành cùng Đậu Ánh!\n\n🎁 Ưu đãi đặc biệt dành riêng cho bạn:\n🔥 Giảm [XX]% toàn bộ sản phẩm\n🎀 Tặng [quà tặng] cho đơn từ [số tiền]\n📦 Free ship toàn quốc\n\n⏰ Chỉ trong [thời gian]!\n👉 Mua ngay: [Link]\n\n#ĐậuÁnh #TriÂn #KháchHàng'
        }
      ]
    },
    {
      id: 'tips',
      name: '💡 Chia sẻ kiến thức',
      icon: '💡',
      templates: [
        {
          name: 'Tips hữu ích',
          content: '💡 [SỐ] MẸO [CHỦ ĐỀ] BẠN NÊN BIẾT!\n\n1️⃣ [Mẹo 1]\n→ [Giải thích ngắn]\n\n2️⃣ [Mẹo 2]\n→ [Giải thích ngắn]\n\n3️⃣ [Mẹo 3]\n→ [Giải thích ngắn]\n\n📌 Lưu bài viết này để dùng khi cần nhé!\n💬 Bạn còn mẹo nào khác? Chia sẻ với chúng tôi!\n\n#ĐậuÁnh #MẹoHay #KiếnThức'
        },
        {
          name: 'Hướng dẫn',
          content: '📚 HƯỚNG DẪN: [Chủ đề]\n\n🔹 Bước 1: [Hướng dẫn]\n🔹 Bước 2: [Hướng dẫn]\n🔹 Bước 3: [Hướng dẫn]\n🔹 Bước 4: [Hướng dẫn]\n\n💡 Lưu ý quan trọng: [Lưu ý]\n\n👉 Xem thêm hướng dẫn chi tiết tại: [Link]\n\n📌 Save lại để dùng khi cần!\n\n#ĐậuÁnh #HướngDẫn #Tips'
        }
      ]
    }
  ],

  getAll() {
    return this.categories.flatMap(cat =>
      cat.templates.map(t => ({ ...t, category: cat.name, categoryId: cat.id }))
    );
  },

  getByCategory(categoryId) {
    const cat = this.categories.find(c => c.id === categoryId);
    return cat ? cat.templates : [];
  },

  search(query) {
    const q = query.toLowerCase();
    return this.getAll().filter(t =>
      t.name.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)
    );
  }
};
