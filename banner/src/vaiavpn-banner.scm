; vaiavpn-banner.scm — простой рекламный баннер VaiaVPN 800x400 (GIMP 2.6+, Script-Fu)
;
; Через меню: положите файл в папку scripts профиля GIMP
; (Windows: C:\Users\<имя>\.gimp-2.6\scripts), Фильтры → Script-Fu →
; Обновить сценарии, затем Файл → Создать → VaiaVPN баннер.
;
; Из командной строки:
;   gimp -i -b '(begin (load "vaiavpn-banner.scm") (vv-build "lock.png" "out/" FALSE))' \
;           -b '(gimp-quit 0)'

(define vv-lime  '(166 222 30))
(define vv-light '(200 240 58))
(define vv-white '(255 255 255))
(define vv-font  "Sans Bold")

(define (vv-text img x y str size color)
  (gimp-context-set-foreground color)
  (car (gimp-text-fontname img -1 x y str 0 TRUE size PIXELS vv-font)))

; Круглая кисть нужного диаметра: в 2.8+ размер задаётся отдельно,
; в 2.6 выбирается готовая кисть «Circle (NN)».
(define (vv-brush px)
  (if (defined? 'gimp-context-set-brush-size)
      (begin
        (gimp-context-set-brush "2. Hardness 100")
        (gimp-context-set-brush-size px))
      (gimp-context-set-brush (if (<= px 3) "Circle (03)" "Circle (05)"))))

(define (vv-build lock-file out-dir show)
  (let* ((img (car (gimp-image-new 800 400 RGB)))
         (bg (car (gimp-layer-new img 800 400 RGB-IMAGE "Фон" 100 NORMAL-MODE))))
    (gimp-context-push)
    (gimp-image-undo-disable img)
    (gimp-image-add-layer img bg 0)

    ; 1. Фон: градиент от чёрного к тёмно-зелёному + зелёная рамка
    (gimp-context-set-foreground '(0 9 8))
    (gimp-context-set-background '(14 70 20))
    (gimp-edit-blend bg FG-BG-RGB-MODE NORMAL-MODE GRADIENT-LINEAR 100 0
                     REPEAT-NONE FALSE FALSE 1 0 TRUE 0 0 0 400)
    (let ((frame (car (gimp-layer-new img 800 400 RGBA-IMAGE "Рамка" 100 NORMAL-MODE))))
      (gimp-image-add-layer img frame 0)
      (gimp-drawable-fill frame TRANSPARENT-FILL)
      (gimp-rect-select img 12 12 776 376 CHANNEL-OP-REPLACE FALSE 0)
      (gimp-context-set-foreground vv-lime)
      (vv-brush 5)
      (gimp-edit-stroke frame)
      (gimp-selection-none img))

    ; 2. Импорт картинки: замок, осветлить и добавить тень
    (let ((lock (car (gimp-file-load-layer RUN-NONINTERACTIVE img lock-file))))
      (gimp-image-add-layer img lock 0)
      (gimp-drawable-set-name lock "Замок")
      (gimp-layer-set-offsets lock 540 70)
      (gimp-brightness-contrast lock 20 10)
      (script-fu-drop-shadow img lock 6 6 10 '(0 0 0) 70 FALSE))

    ; 3. Текст
    (let ((title (vv-text img 40 28 "VaiaVPN" 80 vv-lime)))
      (script-fu-drop-shadow img title 5 5 8 '(0 0 0) 80 FALSE))
    (vv-text img 42 135 "Бесплатно для всех" 36 vv-white)
    (vv-text img 42 180 "до 1 ноября!" 36 vv-light)
    (vv-text img 42 248 "Наш бот в Telegram:" 24 vv-white)
    (vv-text img 42 280 "@VAIAVPN_bot" 38 vv-lime)
    (vv-text img 42 342 "Ссылка на бонус — в закрепе нашего ТГ-канала" 20 vv-white)

    ; обычный режим слоёв, чтобы XCF открывался и в старых версиях GIMP
    (for-each (lambda (l) (gimp-layer-set-mode l NORMAL-MODE))
              (vector->list (cadr (gimp-image-get-layers img))))

    ; Сохранение: XCF со слоями + PNG и JPG
    (gimp-image-undo-enable img)
    (gimp-xcf-save 0 img bg (string-append out-dir "vaiavpn_banner.xcf")
                   (string-append out-dir "vaiavpn_banner.xcf"))
    (let* ((flat (car (gimp-image-duplicate img)))
           (layer (car (gimp-image-flatten flat))))
      (file-png-save RUN-NONINTERACTIVE flat layer
                     (string-append out-dir "vaiavpn_banner.png")
                     (string-append out-dir "vaiavpn_banner.png")
                     FALSE 9 FALSE FALSE FALSE FALSE FALSE)
      (file-jpeg-save RUN-NONINTERACTIVE flat layer
                      (string-append out-dir "vaiavpn_banner.jpg")
                      (string-append out-dir "vaiavpn_banner.jpg")
                      0.95 0 1 0 "VaiaVPN" 2 1 0 2)
      (gimp-image-delete flat))
    (gimp-context-pop)
    (if (= show TRUE)
        (gimp-display-new img)
        (gimp-image-delete img))))

(define (script-fu-vaiavpn-banner lock-file out-dir)
  (vv-build lock-file (string-append out-dir DIR-SEPARATOR) TRUE))

(script-fu-register "script-fu-vaiavpn-banner"
  "VaiaVPN баннер..."
  "Простой рекламный баннер VaiaVPN 800x400"
  "VaiaVPN"
  "VaiaVPN"
  "2026"
  ""
  SF-FILENAME "Картинка (PNG)" "lock.png"
  SF-DIRNAME  "Папка для сохранения" "")

(script-fu-menu-register "script-fu-vaiavpn-banner" "<Image>/File/Create")
