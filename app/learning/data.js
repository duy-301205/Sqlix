export const SQL_COURSES = [
    {
        category: 'SQL cơ bản',
        lessons: [
            { id: 'select', title: '01. SELECT', completed: true },
            { id: 'where', title: '02. WHERE', completed: false },
            { id: 'order-by', title: '03. ORDER BY', completed: false },
            { id: 'distinct', title: '04. DISTINCT', completed: false },
            { id: 'limit', title: '05. LIMIT', completed: false },
        ],
    },
    {
        category: 'SQL nâng cao',
        lessons: [
            { id: 'joins', title: '06. INNER & OUTER JOIN', completed: false },
            { id: 'group-by', title: '07. GROUP BY & HAVING', completed: false },
            { id: 'subqueries', title: '08. Subqueries & CTEs', completed: false },
            { id: 'window-funcs', title: '09. Window Functions', completed: false },
            { id: 'indexes', title: '10. Indexing & Tuning', completed: false },
        ],
    },
];

export const LESSONS_DATABASE = {
    select: {
        id: 'select',
        category: 'SQL cơ bản',
        title: '01. SELECT',
        nextLessonId: 'where',
        nextLessonTitle: '02. WHERE',
        prevLessonId: null,
        description:
            'Tìm hiểu câu lệnh SELECT, thành phần quan trọng nhất trong SQL dùng để truy vấn và trích xuất dữ liệu từ cơ sở dữ liệu.',
        objectives: [
            'Hiểu cú pháp cơ bản và cơ chế hoạt động của câu lệnh SELECT.',
            'Truy vấn toàn bộ dữ liệu từ một bảng bằng ký tự đại diện (*).',
            'Chỉ định các cột cụ thể cần lấy từ bảng.',
            'Đặt bí danh cho cột bằng AS.',
            'Tạo các biểu thức tính toán trực tiếp trong câu SELECT.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. SELECT là gì?',
                content:
                    'SELECT là câu lệnh được sử dụng để truy vấn dữ liệu từ một hoặc nhiều bảng trong cơ sở dữ liệu quan hệ. Đây là câu lệnh SQL được sử dụng thường xuyên nhất khi làm việc với dữ liệu.',
                code: `SELECT *
FROM students;`,
                note:
                    'Dấu * đại diện cho toàn bộ các cột trong bảng students.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. SELECT một số cột cụ thể',
                content:
                    'Trong thực tế, bạn nên chỉ định rõ những cột cần lấy thay vì sử dụng *. Điều này giúp câu truy vấn rõ ràng hơn và tránh lấy dữ liệu không cần thiết.',
                code: `SELECT id, name, gpa
FROM students;`,
                note:
                    'Chỉ lấy các cột cần thiết giúp giảm lượng dữ liệu phải truyền và xử lý.',
                noteType: 'tip',
            },
            {
                id: 'section-3',
                heading: '3. Đặt bí danh cho cột với AS',
                content:
                    'Từ khóa AS cho phép đặt tên hiển thị khác cho một cột trong kết quả truy vấn. Bí danh thường được sử dụng để làm cho kết quả dễ đọc hơn.',
                code: `SELECT
    name AS student_name,
    gpa AS average_score
FROM students;`,
                note:
                    'AS chỉ thay đổi tên hiển thị trong kết quả SELECT, không thay đổi tên cột thật trong database.',
                noteType: 'info',
            },
            {
                id: 'section-4',
                heading: '4. Tính toán trong SELECT',
                content:
                    'SQL cho phép thực hiện các phép tính trực tiếp trong câu SELECT. Bạn có thể kết hợp nhiều cột để tạo ra một giá trị mới.',
                code: `SELECT
    name,
    math_score + english_score AS total_score
FROM students;`,
                note:
                    'Các biểu thức tính toán có thể được đặt bí danh để kết quả dễ hiểu hơn.',
                noteType: 'tip',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. SELECT là gì?' },
            { id: 'section-2', title: '2. SELECT một số cột' },
            { id: 'section-3', title: '3. Đặt bí danh với AS' },
            { id: 'section-4', title: '4. Tính toán trong SELECT' },
        ],
    },

    where: {
        id: 'where',
        category: 'SQL cơ bản',
        title: '02. WHERE',
        nextLessonId: 'order-by',
        nextLessonTitle: '03. ORDER BY',
        prevLessonId: 'select',
        description:
            'Sử dụng mệnh đề WHERE để lọc và chỉ lấy những bản ghi thỏa mãn một hoặc nhiều điều kiện.',
        objectives: [
            'Hiểu vị trí và vai trò của mệnh đề WHERE.',
            'Sử dụng các toán tử so sánh =, >, <, >=, <=, !=.',
            'Kết hợp nhiều điều kiện với AND, OR và NOT.',
            'Lọc dữ liệu theo khoảng giá trị với BETWEEN.',
            'Lọc dữ liệu theo danh sách với IN.',
            'Tìm kiếm chuỗi bằng LIKE.',
            'Kiểm tra giá trị NULL bằng IS NULL và IS NOT NULL.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. Cú pháp mệnh đề WHERE',
                content:
                    'WHERE được sử dụng để lọc các dòng dữ liệu trước khi kết quả được trả về. Chỉ những bản ghi thỏa mãn điều kiện trong WHERE mới xuất hiện.',
                code: `SELECT name, gpa
FROM students
WHERE gpa >= 8.0;`,
                note:
                    'Ví dụ trên chỉ trả về những sinh viên có GPA lớn hơn hoặc bằng 8.0.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. Các toán tử so sánh',
                content:
                    'SQL cung cấp nhiều toán tử để so sánh giá trị. Các toán tử thường gặp gồm =, !=, <>, >, <, >= và <=.',
                code: `SELECT name, age
FROM students
WHERE age >= 20;`,
                note:
                    'Trong SQL, != và <> thường đều được sử dụng để biểu diễn khác nhau.',
                noteType: 'info',
            },
            {
                id: 'section-3',
                heading: '3. Kết hợp AND và OR',
                content:
                    'AND yêu cầu tất cả điều kiện phải đúng, trong khi OR chỉ cần ít nhất một điều kiện đúng.',
                code: `SELECT name, gpa, major
FROM students
WHERE gpa >= 8.0
  AND major = 'CNTT';`,
                note:
                    'Khi kết hợp AND và OR trong cùng một câu truy vấn, nên sử dụng dấu ngoặc để làm rõ logic.',
                noteType: 'tip',
            },
            {
                id: 'section-4',
                heading: '4. Sử dụng BETWEEN',
                content:
                    'BETWEEN được dùng để kiểm tra một giá trị có nằm trong một khoảng xác định hay không. Hai giá trị đầu và cuối đều được tính.',
                code: `SELECT name, gpa
FROM students
WHERE gpa BETWEEN 7.0 AND 8.5;`,
                note:
                    'BETWEEN 7.0 AND 8.5 tương đương với gpa >= 7.0 AND gpa <= 8.5.',
                noteType: 'info',
            },
            {
                id: 'section-5',
                heading: '5. Sử dụng IN và LIKE',
                content:
                    'IN giúp kiểm tra một giá trị có thuộc một danh sách hay không. LIKE được sử dụng để tìm kiếm chuỗi theo mẫu.',
                code: `SELECT name, major
FROM students
WHERE major IN ('CNTT', 'KTPM');

SELECT name
FROM students
WHERE name LIKE 'Nguyen%';`,
                note:
                    'Ký tự % đại diện cho một chuỗi ký tự có độ dài bất kỳ.',
                noteType: 'tip',
            },
            {
                id: 'section-6',
                heading: '6. Kiểm tra NULL',
                content:
                    'NULL biểu diễn giá trị chưa biết hoặc không tồn tại. Không thể sử dụng = NULL để kiểm tra NULL.',
                code: `SELECT name, phone
FROM students
WHERE phone IS NULL;`,
                note:
                    'Sử dụng IS NULL hoặc IS NOT NULL thay vì = NULL hoặc != NULL.',
                noteType: 'warning',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. Cú pháp WHERE' },
            { id: 'section-2', title: '2. Toán tử so sánh' },
            { id: 'section-3', title: '3. Kết hợp AND và OR' },
            { id: 'section-4', title: '4. Sử dụng BETWEEN' },
            { id: 'section-5', title: '5. Sử dụng IN và LIKE' },
            { id: 'section-6', title: '6. Kiểm tra NULL' },
        ],
    },

    'order-by': {
        id: 'order-by',
        category: 'SQL cơ bản',
        title: '03. ORDER BY',
        nextLessonId: 'distinct',
        nextLessonTitle: '04. DISTINCT',
        prevLessonId: 'where',
        description:
            'Sử dụng ORDER BY để sắp xếp dữ liệu trong kết quả truy vấn theo thứ tự tăng dần hoặc giảm dần.',
        objectives: [
            'Hiểu cách hoạt động của ORDER BY.',
            'Sắp xếp dữ liệu tăng dần với ASC.',
            'Sắp xếp dữ liệu giảm dần với DESC.',
            'Sắp xếp dữ liệu dựa trên nhiều cột.',
            'Kết hợp ORDER BY với WHERE.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. Sắp xếp với ORDER BY',
                content:
                    'ORDER BY được sử dụng để xác định thứ tự xuất hiện của các bản ghi trong kết quả truy vấn.',
                code: `SELECT name, gpa
FROM students
ORDER BY gpa;`,
                note:
                    'Nếu không chỉ định ASC hoặc DESC thì mặc định ORDER BY sử dụng ASC.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. Sắp xếp giảm dần với DESC',
                content:
                    'DESC được sử dụng khi muốn đưa các giá trị lớn hơn lên trước.',
                code: `SELECT name, gpa
FROM students
ORDER BY gpa DESC;`,
                note:
                    'DESC thường được sử dụng khi muốn tìm các giá trị cao nhất trước.',
                noteType: 'tip',
            },
            {
                id: 'section-3',
                heading: '3. Sắp xếp theo nhiều cột',
                content:
                    'Bạn có thể sắp xếp theo nhiều cột. Database sẽ ưu tiên cột đầu tiên, sau đó dùng các cột tiếp theo khi giá trị bằng nhau.',
                code: `SELECT name, major, gpa
FROM students
ORDER BY major ASC, gpa DESC;`,
                note:
                    'Ví dụ trên sắp xếp ngành theo A-Z, sau đó sinh viên có GPA cao hơn sẽ đứng trước trong cùng một ngành.',
                noteType: 'info',
            },
            {
                id: 'section-4',
                heading: '4. Kết hợp WHERE và ORDER BY',
                content:
                    'WHERE có thể được sử dụng để lọc dữ liệu trước, sau đó ORDER BY sắp xếp tập kết quả đã được lọc.',
                code: `SELECT name, gpa
FROM students
WHERE gpa >= 7.0
ORDER BY gpa DESC;`,
                note:
                    'Thứ tự logic của truy vấn là lọc dữ liệu bằng WHERE trước rồi sắp xếp bằng ORDER BY.',
                noteType: 'tip',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. Sắp xếp với ORDER BY' },
            { id: 'section-2', title: '2. Sắp xếp giảm dần' },
            { id: 'section-3', title: '3. Sắp xếp nhiều cột' },
            { id: 'section-4', title: '4. Kết hợp WHERE và ORDER BY' },
        ],
    },

    distinct: {
        id: 'distinct',
        category: 'SQL cơ bản',
        title: '04. DISTINCT',
        nextLessonId: 'limit',
        nextLessonTitle: '05. LIMIT',
        prevLessonId: 'order-by',
        description:
            'Sử dụng DISTINCT để loại bỏ các dòng dữ liệu trùng lặp trong tập kết quả truy vấn.',
        objectives: [
            'Hiểu mục đích của DISTINCT.',
            'Loại bỏ các giá trị trùng lặp trong một cột.',
            'Sử dụng DISTINCT trên nhiều cột.',
            'Phân biệt DISTINCT với GROUP BY.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. DISTINCT là gì?',
                content:
                    'DISTINCT loại bỏ các dòng bị trùng nhau trong kết quả SELECT và chỉ giữ lại các giá trị duy nhất.',
                code: `SELECT DISTINCT major
FROM students;`,
                note:
                    'Kết quả chỉ chứa mỗi ngành học một lần dù bảng students có nhiều sinh viên cùng ngành.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. DISTINCT trên nhiều cột',
                content:
                    'Khi sử dụng DISTINCT với nhiều cột, database sẽ loại bỏ các dòng có toàn bộ giá trị của các cột đó giống nhau.',
                code: `SELECT DISTINCT major, class_name
FROM students;`,
                note:
                    'DISTINCT áp dụng cho tổ hợp major và class_name chứ không xử lý từng cột độc lập.',
                noteType: 'tip',
            },
            {
                id: 'section-3',
                heading: '3. DISTINCT kết hợp ORDER BY',
                content:
                    'DISTINCT có thể kết hợp với ORDER BY để lấy danh sách giá trị duy nhất theo một thứ tự nhất định.',
                code: `SELECT DISTINCT major
FROM students
ORDER BY major ASC;`,
                note:
                    'Kết quả sẽ là danh sách các ngành không trùng nhau và được sắp xếp theo alphabet.',
                noteType: 'info',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. DISTINCT là gì?' },
            { id: 'section-2', title: '2. DISTINCT nhiều cột' },
            { id: 'section-3', title: '3. DISTINCT và ORDER BY' },
        ],
    },

    limit: {
        id: 'limit',
        category: 'SQL cơ bản',
        title: '05. LIMIT',
        nextLessonId: 'joins',
        nextLessonTitle: '06. INNER & OUTER JOIN',
        prevLessonId: 'distinct',
        description:
            'Sử dụng LIMIT để giới hạn số lượng bản ghi được trả về từ một câu truy vấn.',
        objectives: [
            'Hiểu cách giới hạn số lượng dòng bằng LIMIT.',
            'Kết hợp LIMIT với ORDER BY.',
            'Lấy TOP-N bản ghi theo một tiêu chí.',
            'Sử dụng OFFSET để bỏ qua một số dòng đầu tiên.',
            'Hiểu cách sử dụng LIMIT trong phân trang.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. Giới hạn số dòng với LIMIT',
                content:
                    'LIMIT cho phép giới hạn số lượng bản ghi mà câu truy vấn trả về.',
                code: `SELECT *
FROM students
LIMIT 10;`,
                note:
                    'Câu truy vấn chỉ trả về tối đa 10 bản ghi.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. TOP-N với ORDER BY và LIMIT',
                content:
                    'Để lấy N bản ghi cao nhất hoặc thấp nhất, nên kết hợp ORDER BY với LIMIT.',
                code: `SELECT name, gpa
FROM students
ORDER BY gpa DESC
LIMIT 5;`,
                note:
                    'Ví dụ trên lấy 5 sinh viên có GPA cao nhất.',
                noteType: 'tip',
            },
            {
                id: 'section-3',
                heading: '3. Sử dụng OFFSET',
                content:
                    'OFFSET cho phép bỏ qua một số dòng đầu tiên trước khi lấy dữ liệu.',
                code: `SELECT id, name, gpa
FROM students
ORDER BY id
LIMIT 10 OFFSET 20;`,
                note:
                    'Truy vấn trên bỏ qua 20 dòng đầu tiên và lấy tối đa 10 dòng tiếp theo.',
                noteType: 'info',
            },
            {
                id: 'section-4',
                heading: '4. LIMIT trong phân trang',
                content:
                    'LIMIT và OFFSET thường được sử dụng để xây dựng chức năng phân trang trong các ứng dụng web.',
                code: `SELECT *
FROM students
ORDER BY id
LIMIT 20 OFFSET 40;`,
                note:
                    'Nếu mỗi trang có 20 bản ghi thì OFFSET 40 tương ứng với trang thứ 3.',
                noteType: 'tip',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. Giới hạn số dòng' },
            { id: 'section-2', title: '2. TOP-N với LIMIT' },
            { id: 'section-3', title: '3. Sử dụng OFFSET' },
            { id: 'section-4', title: '4. LIMIT trong phân trang' },
        ],
    },

    joins: {
        id: 'joins',
        category: 'SQL nâng cao',
        title: '06. INNER & OUTER JOIN',
        nextLessonId: 'group-by',
        nextLessonTitle: '07. GROUP BY & HAVING',
        prevLessonId: 'limit',
        description:
            'Tìm hiểu cách kết hợp dữ liệu từ nhiều bảng bằng INNER JOIN, LEFT JOIN, RIGHT JOIN và FULL OUTER JOIN.',
        objectives: [
            'Hiểu tại sao cần JOIN giữa các bảng.',
            'Sử dụng INNER JOIN để lấy dữ liệu khớp giữa hai bảng.',
            'Sử dụng LEFT JOIN để giữ toàn bộ dữ liệu của bảng bên trái.',
            'Hiểu cách hoạt động của RIGHT JOIN và FULL OUTER JOIN.',
            'Kết hợp JOIN với WHERE và ORDER BY.',
            'Sử dụng alias để viết JOIN rõ ràng hơn.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. JOIN là gì?',
                content:
                    'JOIN cho phép kết hợp các bản ghi từ hai hoặc nhiều bảng dựa trên một điều kiện liên kết. Đây là một trong những kỹ năng quan trọng nhất khi làm việc với cơ sở dữ liệu quan hệ.',
                code: `SELECT
    students.name,
    classes.name AS class_name
FROM students
INNER JOIN classes
    ON students.class_id = classes.id;`,
                note:
                    'Điều kiện ON xác định cách hai bảng được liên kết với nhau.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. INNER JOIN',
                content:
                    'INNER JOIN chỉ trả về những bản ghi có dữ liệu khớp ở cả hai bảng.',
                code: `SELECT
    s.name,
    c.name AS class_name
FROM students s
INNER JOIN classes c
    ON s.class_id = c.id;`,
                note:
                    'Nếu một sinh viên không có class_id tương ứng trong bảng classes thì sinh viên đó sẽ không xuất hiện.',
                noteType: 'info',
            },
            {
                id: 'section-3',
                heading: '3. LEFT JOIN',
                content:
                    'LEFT JOIN giữ lại toàn bộ bản ghi của bảng bên trái, kể cả khi không tìm thấy bản ghi tương ứng ở bảng bên phải.',
                code: `SELECT
    s.name,
    c.name AS class_name
FROM students s
LEFT JOIN classes c
    ON s.class_id = c.id;`,
                note:
                    'Nếu không có lớp tương ứng, các cột từ bảng classes sẽ có giá trị NULL.',
                noteType: 'tip',
            },
            {
                id: 'section-4',
                heading: '4. JOIN nhiều bảng',
                content:
                    'Một câu truy vấn có thể JOIN nhiều bảng liên tiếp để lấy dữ liệu từ nhiều nguồn khác nhau.',
                code: `SELECT
    s.name,
    c.name AS class_name,
    d.name AS department_name
FROM students s
JOIN classes c
    ON s.class_id = c.id
JOIN departments d
    ON c.department_id = d.id;`,
                note:
                    'Nên sử dụng alias như s, c, d để câu SQL ngắn gọn và dễ đọc.',
                noteType: 'tip',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. JOIN là gì?' },
            { id: 'section-2', title: '2. INNER JOIN' },
            { id: 'section-3', title: '3. LEFT JOIN' },
            { id: 'section-4', title: '4. JOIN nhiều bảng' },
        ],
    },

    'group-by': {
        id: 'group-by',
        category: 'SQL nâng cao',
        title: '07. GROUP BY & HAVING',
        nextLessonId: 'subqueries',
        nextLessonTitle: '08. Subqueries & CTEs',
        prevLessonId: 'joins',
        description:
            'Sử dụng GROUP BY để gom nhóm dữ liệu và các hàm tổng hợp như COUNT, SUM, AVG, MIN, MAX để phân tích dữ liệu.',
        objectives: [
            'Hiểu cách hoạt động của GROUP BY.',
            'Sử dụng COUNT, SUM, AVG, MIN và MAX.',
            'Kết hợp GROUP BY với nhiều cột.',
            'Hiểu sự khác nhau giữa WHERE và HAVING.',
            'Lọc các nhóm dữ liệu bằng HAVING.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. GROUP BY là gì?',
                content:
                    'GROUP BY gom các dòng có cùng giá trị thành từng nhóm để có thể thực hiện các phép tính tổng hợp trên từng nhóm.',
                code: `SELECT
    major,
    COUNT(*) AS student_count
FROM students
GROUP BY major;`,
                note:
                    'Mỗi ngành sẽ trở thành một nhóm và COUNT(*) đếm số sinh viên trong từng nhóm.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. Các hàm tổng hợp',
                content:
                    'SQL cung cấp nhiều hàm tổng hợp phổ biến như COUNT, SUM, AVG, MIN và MAX để tính toán trên một tập dữ liệu.',
                code: `SELECT
    COUNT(*) AS total_students,
    AVG(gpa) AS average_gpa,
    MAX(gpa) AS highest_gpa,
    MIN(gpa) AS lowest_gpa
FROM students;`,
                note:
                    'Các hàm tổng hợp thường được sử dụng kết hợp với GROUP BY khi cần thống kê theo từng nhóm.',
                noteType: 'tip',
            },
            {
                id: 'section-3',
                heading: '3. GROUP BY nhiều cột',
                content:
                    'Bạn có thể GROUP BY nhiều cột để tạo các nhóm chi tiết hơn.',
                code: `SELECT
    major,
    class_name,
    COUNT(*) AS student_count
FROM students
GROUP BY major, class_name;`,
                note:
                    'Mỗi tổ hợp major và class_name sẽ tạo thành một nhóm riêng.',
                noteType: 'info',
            },
            {
                id: 'section-4',
                heading: '4. HAVING dùng để làm gì?',
                content:
                    'HAVING được dùng để lọc các nhóm sau khi GROUP BY đã thực hiện việc gom nhóm.',
                code: `SELECT
    major,
    COUNT(*) AS student_count
FROM students
GROUP BY major
HAVING COUNT(*) >= 10;`,
                note:
                    'HAVING khác WHERE ở chỗ HAVING lọc nhóm, còn WHERE lọc từng bản ghi trước khi nhóm.',
                noteType: 'warning',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. GROUP BY là gì?' },
            { id: 'section-2', title: '2. Các hàm tổng hợp' },
            { id: 'section-3', title: '3. GROUP BY nhiều cột' },
            { id: 'section-4', title: '4. HAVING' },
        ],
    },

    subqueries: {
        id: 'subqueries',
        category: 'SQL nâng cao',
        title: '08. Subqueries & CTEs',
        nextLessonId: 'window-funcs',
        nextLessonTitle: '09. Window Functions',
        prevLessonId: 'group-by',
        description:
            'Tìm hiểu Subquery và Common Table Expression (CTE) để xây dựng các câu truy vấn phức tạp theo từng bước.',
        objectives: [
            'Hiểu khái niệm Subquery.',
            'Sử dụng Subquery trong WHERE.',
            'Sử dụng Subquery trong FROM.',
            'Sử dụng EXISTS để kiểm tra sự tồn tại.',
            'Hiểu Common Table Expression với WITH.',
            'Biết khi nào nên sử dụng CTE thay cho Subquery.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. Subquery là gì?',
                content:
                    'Subquery là một câu truy vấn được đặt bên trong một câu truy vấn khác. Kết quả của Subquery có thể được sử dụng bởi truy vấn bên ngoài.',
                code: `SELECT name, gpa
FROM students
WHERE gpa > (
    SELECT AVG(gpa)
    FROM students
);`,
                note:
                    'Ví dụ trên tìm những sinh viên có GPA cao hơn GPA trung bình của toàn bộ sinh viên.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. Subquery trong WHERE',
                content:
                    'Subquery thường được sử dụng trong WHERE để so sánh dữ liệu với một giá trị hoặc một tập kết quả được tính toán từ truy vấn khác.',
                code: `SELECT name, gpa
FROM students
WHERE major IN (
    SELECT name
    FROM departments
    WHERE faculty = 'CNTT'
);`,
                note:
                    'Subquery có thể trả về một hoặc nhiều giá trị tùy theo cách sử dụng.',
                noteType: 'tip',
            },
            {
                id: 'section-3',
                heading: '3. EXISTS',
                content:
                    'EXISTS kiểm tra xem Subquery có trả về ít nhất một bản ghi hay không.',
                code: `SELECT s.name
FROM students s
WHERE EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.student_id = s.id
);`,
                note:
                    'EXISTS thường hữu ích khi chỉ quan tâm việc dữ liệu có tồn tại hay không.',
                noteType: 'info',
            },
            {
                id: 'section-4',
                heading: '4. CTE với WITH',
                content:
                    'CTE cho phép đặt tên cho một tập kết quả tạm thời và sử dụng nó trong câu truy vấn chính. CTE giúp các truy vấn phức tạp dễ đọc hơn.',
                code: `WITH high_gpa_students AS (
    SELECT id, name, gpa
    FROM students
    WHERE gpa >= 8.0
)
SELECT *
FROM high_gpa_students
ORDER BY gpa DESC;`,
                note:
                    'CTE bắt đầu bằng WITH và thường được sử dụng để chia một bài toán SQL lớn thành nhiều bước dễ hiểu.',
                noteType: 'tip',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. Subquery là gì?' },
            { id: 'section-2', title: '2. Subquery trong WHERE' },
            { id: 'section-3', title: '3. EXISTS' },
            { id: 'section-4', title: '4. CTE với WITH' },
        ],
    },

    'window-funcs': {
        id: 'window-funcs',
        category: 'SQL nâng cao',
        title: '09. Window Functions',
        nextLessonId: 'indexes',
        nextLessonTitle: '10. Indexing & Tuning',
        prevLessonId: 'subqueries',
        description:
            'Sử dụng Window Functions để thực hiện các phép tính trên một nhóm dòng liên quan mà không làm mất đi từng dòng dữ liệu ban đầu.',
        objectives: [
            'Hiểu khái niệm Window Function.',
            'Sử dụng OVER() để định nghĩa cửa sổ dữ liệu.',
            'Sử dụng ROW_NUMBER để đánh số dòng.',
            'Sử dụng RANK và DENSE_RANK để xếp hạng.',
            'Sử dụng PARTITION BY để chia dữ liệu thành từng nhóm.',
            'Tính tổng hoặc trung bình theo từng nhóm mà vẫn giữ nguyên từng bản ghi.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. Window Function là gì?',
                content:
                    'Window Function thực hiện phép tính trên một tập hợp các dòng liên quan đến dòng hiện tại nhưng không gom các dòng thành một dòng duy nhất như GROUP BY.',
                code: `SELECT
    name,
    major,
    gpa,
    AVG(gpa) OVER () AS average_gpa
FROM students;`,
                note:
                    'Mỗi sinh viên vẫn được giữ lại trong kết quả nhưng có thêm cột GPA trung bình của toàn bộ sinh viên.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. ROW_NUMBER',
                content:
                    'ROW_NUMBER đánh số thứ tự cho từng dòng trong tập kết quả.',
                code: `SELECT
    name,
    gpa,
    ROW_NUMBER() OVER (
        ORDER BY gpa DESC
    ) AS ranking
FROM students;`,
                note:
                    'ROW_NUMBER luôn tạo thứ tự duy nhất cho từng dòng.',
                noteType: 'tip',
            },
            {
                id: 'section-3',
                heading: '3. RANK và DENSE_RANK',
                content:
                    'RANK và DENSE_RANK dùng để xếp hạng dữ liệu. Điểm khác biệt nằm ở cách xử lý khi nhiều dòng có cùng thứ hạng.',
                code: `SELECT
    name,
    gpa,
    RANK() OVER (
        ORDER BY gpa DESC
    ) AS rank_number,
    DENSE_RANK() OVER (
        ORDER BY gpa DESC
    ) AS dense_rank_number
FROM students;`,
                note:
                    'RANK có thể tạo khoảng trống thứ hạng sau khi có giá trị bằng nhau, trong khi DENSE_RANK không tạo khoảng trống.',
                noteType: 'info',
            },
            {
                id: 'section-4',
                heading: '4. PARTITION BY',
                content:
                    'PARTITION BY chia dữ liệu thành nhiều nhóm nhỏ. Window Function sau đó được tính độc lập trên từng nhóm.',
                code: `SELECT
    name,
    major,
    gpa,
    RANK() OVER (
        PARTITION BY major
        ORDER BY gpa DESC
    ) AS major_rank
FROM students;`,
                note:
                    'Ví dụ trên xếp hạng sinh viên trong từng ngành thay vì xếp hạng trên toàn bộ trường.',
                noteType: 'tip',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. Window Function là gì?' },
            { id: 'section-2', title: '2. ROW_NUMBER' },
            { id: 'section-3', title: '3. RANK và DENSE_RANK' },
            { id: 'section-4', title: '4. PARTITION BY' },
        ],
    },

    indexes: {
        id: 'indexes',
        category: 'SQL nâng cao',
        title: '10. Indexing & Tuning',
        nextLessonId: null,
        nextLessonTitle: null,
        prevLessonId: 'window-funcs',
        description:
            'Tìm hiểu Index và các kỹ thuật cơ bản để phân tích, tối ưu hiệu năng truy vấn SQL trong cơ sở dữ liệu.',
        objectives: [
            'Hiểu Index là gì và tại sao Index giúp tăng tốc truy vấn.',
            'Biết cách tạo và xóa Index.',
            'Hiểu tác động của Index lên SELECT, INSERT, UPDATE và DELETE.',
            'Biết khi nào nên và không nên tạo Index.',
            'Hiểu khái niệm Composite Index.',
            'Sử dụng EXPLAIN để phân tích kế hoạch thực thi truy vấn.',
        ],
        sections: [
            {
                id: 'section-1',
                heading: '1. Index là gì?',
                content:
                    'Index là một cấu trúc dữ liệu được database sử dụng để tìm kiếm bản ghi nhanh hơn thay vì phải quét toàn bộ bảng trong nhiều trường hợp.',
                code: `CREATE INDEX idx_students_name
ON students(name);`,
                note:
                    'Index thường hữu ích với các cột thường xuyên xuất hiện trong WHERE, JOIN hoặc ORDER BY.',
                noteType: 'info',
            },
            {
                id: 'section-2',
                heading: '2. Truy vấn sử dụng Index',
                content:
                    'Khi một cột được lập Index và câu truy vấn sử dụng cột đó phù hợp, database có thể tận dụng Index để giảm lượng dữ liệu phải đọc.',
                code: `SELECT id, name, gpa
FROM students
WHERE name = 'Nguyen Van An';`,
                note:
                    'Việc database có sử dụng Index hay không còn phụ thuộc vào dữ liệu, thống kê và query planner.',
                noteType: 'tip',
            },
            {
                id: 'section-3',
                heading: '3. Composite Index',
                content:
                    'Composite Index là Index được tạo trên nhiều cột. Thứ tự các cột trong Index có ảnh hưởng đến khả năng sử dụng Index của database.',
                code: `CREATE INDEX idx_students_major_gpa
ON students(major, gpa);`,
                note:
                    'Với Index (major, gpa), các truy vấn lọc theo major thường có lợi thế hơn so với việc chỉ lọc theo gpa.',
                noteType: 'warning',
            },
            {
                id: 'section-4',
                heading: '4. Xóa Index',
                content:
                    'Index không còn cần thiết có thể được xóa. Việc giữ quá nhiều Index có thể làm tăng chi phí ghi dữ liệu.',
                code: `DROP INDEX idx_students_name;`,
                note:
                    'Cú pháp DROP INDEX có thể khác nhau giữa các hệ quản trị cơ sở dữ liệu.',
                noteType: 'info',
            },
            {
                id: 'section-5',
                heading: '5. Phân tích truy vấn với EXPLAIN',
                content:
                    'EXPLAIN giúp xem kế hoạch mà database dự kiến sử dụng để thực thi một câu truy vấn. Đây là công cụ quan trọng khi tối ưu SQL.',
                code: `EXPLAIN
SELECT *
FROM students
WHERE major = 'CNTT'
ORDER BY gpa DESC;`,
                note:
                    'Khi tối ưu truy vấn, không nên chỉ dựa vào cảm giác. Hãy kiểm tra execution plan và đo thời gian thực thi thực tế.',
                noteType: 'tip',
            },
        ],
        toc: [
            { id: 'section-1', title: '1. Index là gì?' },
            { id: 'section-2', title: '2. Truy vấn sử dụng Index' },
            { id: 'section-3', title: '3. Composite Index' },
            { id: 'section-4', title: '4. Xóa Index' },
            { id: 'section-5', title: '5. Phân tích với EXPLAIN' },
        ],
    },
};