import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Taramind - Casting Diễn Viên - Phim Ngắn Tâm Linh: Hệ Thống 999" },
    {
      name: "description",
      content: "Công ty Công nghệ Truyền thông Taramind chính thức mời gọi các bạn diễn viên tiềm năng – không phân biệt giới tính, độ tuổi, kinh nghiệm – cùng bước vào đấu trường tâm linh kỳ 9 trong vũ trụ giả tưởng Hệ Thống 999.",
    },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-black/50 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex-shrink-0">
              <img 
                src="/logo/taramind-logo.jpg" 
                alt="Taramind" 
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            CASTING DIỄN VIÊN – PHIM NGẮN TÂM LINH: HỆ THỐNG 999
          </h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg mb-8">
              Công ty Công nghệ Truyền thông Taramind chính thức mời gọi các bạn diễn viên tiềm năng – không phân biệt giới tính, độ tuổi, kinh nghiệm – cùng bước vào đấu trường tâm linh kỳ 9 trong vũ trụ giả tưởng Hệ Thống 999.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4">MỤC ĐÍCH DỰ ÁN</h2>
            <p className="mb-8">
              "Hệ Thống 999" là chuỗi phim ngắn – đầu tư thử nghiệm với ngân sách 2 TỶ VNĐ – khai thác chủ đề tâm linh – nghiệp duyên – đấu trường linh hồn, nơi mỗi nhân vật là đại diện cho một tầng hệ thống phi vật lý.
            </p>
            <p className="mb-8">
              Mỗi vai diễn không chỉ đơn thuần là diễn xuất – mà còn là một hành trình tự khai phá nội tâm, chạm đến ký ức, năng lượng và sự thức tỉnh.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4">THÔNG BÁO DÀNH CHO ỨNG VIÊN CASTING</h2>
            <ul className="list-disc pl-6 mb-8 space-y-2">
              <li>Vui lòng theo dõi fanpage để cập nhật liên tục tuyến nhân vật, nội dung thử vai, và lời thoại để quay video thử.</li>
              <li>Mỗi ứng viên được gửi lời thoại và tình huống riêng để tự quay và gửi về.</li>
              <li>Kết quả vòng lọc hồ sơ sẽ được phản hồi qua email/số điện thoại vào ngày 30/06/2025.</li>
              <li>Các bạn vượt qua vòng đầu sẽ được hẹn gặp trực tiếp để casting vai chính thức vào ngày 07/07/2025.</li>
            </ul>

            <div className="mb-8">
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdimPU6ediynHKB8wfPNQVnKsdb35DTF-DKH6_9J1IgAFKRVQ/viewform" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                BẢNG PHỎNG VẤN CASTING – PHIM HỆ THỐNG 999
              </a>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4">THÔNG TIN LIÊN HỆ</h2>
            <ul className="list-none space-y-2 mb-8">
              <li>Email nhận hồ sơ & video thử vai: <a href="mailto:taramind.media@gmail.com" className="text-blue-400 hover:text-blue-300">taramind.media@gmail.com</a></li>
              <li>Số điện thoại Zalo/Hotline hỗ trợ casting: <a href="tel:0927666653" className="text-blue-400 hover:text-blue-300">0927.6666.53</a></li>
              <li>Fanpage chính thức: <a href="#" className="text-blue-400 hover:text-blue-300">HỆ THỐNG 999 - mật mã tái sinh</a></li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4">THÔNG ĐIỆP TỪ ĐẠI DIỆN SẢN XUẤT</h2>
            <blockquote className="border-l-4 border-gray-600 pl-4 italic mb-8">
              "Chúng tôi không tìm diễn viên giỏi – mà tìm những người thật.
              <br />
              Ai dám sống thật, dám khai mở năng lượng, và dám đứng lên đối mặt với chính mình… đó là người mà 'Hệ Thống 999' cần."
            </blockquote>

            <h2 className="text-2xl font-bold mt-12 mb-4">CHÚNG TÔI KHÔNG TÌM NGƯỜI LÀM VIỆC MIỄN PHÍ</h2>
            <p className="mb-4">
              Công ty chúng tôi hoạt động dựa trên điều kiện rõ ràng, minh bạch và có giá trị trao đổi cụ thể.
            </p>
            <p className="mb-4">
              Mọi video thử vai mà các bạn gửi về sẽ không được đăng tải hoặc sử dụng vào bất kỳ mục đích nào nếu chưa có sự đồng thuận chính thức giữa hai bên.
            </p>
            <p className="mb-4">
              Chúng tôi sẽ chỉ sử dụng video đó khi đã trao đổi rõ ràng:
            </p>
            <ul className="list-disc pl-6 mb-8 space-y-2">
              <li>Các bạn muốn cống hiến cho dự án?</li>
              <li>Hay muốn chuyển nhượng bản quyền video để công ty sử dụng làm tư liệu phát hành?</li>
            </ul>
            <p className="mb-8">
              Tất cả đều cần sự tự nguyện – tôn trọng lẫn nhau – và thỏa thuận rõ ràng trước khi bất kỳ hành động nào diễn ra.
            </p>
          </div>
        </div>
      </main>

      {/* Fixed Copyright Bar */}
      <div className="fixed bottom-0 w-full bg-black/50 backdrop-blur-sm py-3 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white text-sm">© 2024 TARAMIND. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}
