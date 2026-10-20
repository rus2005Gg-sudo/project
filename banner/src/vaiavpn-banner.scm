; vaiavpn-banner.scm — рекламный баннер VaiaVPN 800x400 (GIMP 2.6+, Script-Fu)
;
; Через меню: положите файл в папку scripts профиля GIMP
; (Windows: C:\Users\<имя>\.gimp-2.6\scripts), Фильтры → Script-Fu →
; Обновить сценарии, затем Файл → Создать → VaiaVPN баннер.
;
; Из командной строки:
;   gimp -i -b '(begin (load "vaiavpn-banner.scm")
;                      (vv-build "earth_night.jpg" "phone.jpg" "out/" FALSE))' \
;           -b '(gimp-quit 0)'

(define vv-lime  '(166 222 30))
(define vv-light '(200 240 58))
(define vv-white '(255 255 255))
(define vv-black '(0 0 0))
(define vv-font  "Arial Bold")

(define (vv-text img x y str size color)
  (gimp-context-set-foreground color)
  (car (gimp-text-fontname img -1 x y str 0 TRUE size PIXELS vv-font)))

(define (vv-new-layer img w h name opacity)
  (let ((l (car (gimp-layer-new img w h RGBA-IMAGE name opacity NORMAL-MODE))))
    (gimp-image-add-layer img l 0)
    (gimp-drawable-fill l TRANSPARENT-FILL)
    l))

(define (vv-build earth-file photo-file out-dir show)
  (let* ((img (car (gimp-image-new 800 400 RGB)))
         (bg (car (gimp-file-load-layer RUN-NONINTERACTIVE img earth-file))))
    (gimp-context-push)
    (gimp-image-undo-disable img)

    ; 1. Фон: карта Земли ночью, тонируем в зелёный и осветляем огни
    (gimp-image-add-layer img bg 0)
    (gimp-drawable-set-name bg "Фон — Земля ночью")
    (gimp-layer-scale bg 800 400 FALSE)
    (gimp-layer-set-offsets bg 0 0)
    (gimp-colorize bg 85 70 0)
    (gimp-brightness-contrast bg 20 40)

    ; затемнение слева, чтобы читался текст
    (let ((dark (vv-new-layer img 800 400 "Затемнение" 85)))
      (gimp-context-set-foreground vv-black)
      (gimp-edit-blend dark FG-TRANSPARENT-MODE NORMAL-MODE GRADIENT-LINEAR 100 0
                       REPEAT-NONE FALSE FALSE 1 0 TRUE 0 0 600 0))

    ; 2. Фото: рука с телефоном, обрезаем, рамка, поворот, тень
    (let ((photo (car (gimp-file-load-layer RUN-NONINTERACTIVE img photo-file))))
      (gimp-image-add-layer img photo 0)
      (gimp-drawable-set-name photo "Фото")
      (gimp-layer-resize photo 500 580 -350 -150)
      (gimp-layer-scale photo 240 278 FALSE)
      (gimp-brightness-contrast photo -15 25)
      (gimp-layer-set-offsets photo 528 52)
      (let ((frame (car (gimp-layer-new img 252 290 RGBA-IMAGE "Рамка" 100 NORMAL-MODE))))
        (gimp-image-add-layer img frame 1)
        (gimp-context-set-foreground vv-lime)
        (gimp-drawable-fill frame FOREGROUND-FILL)
        (gimp-layer-set-offsets frame 522 46))
      (set! photo (car (gimp-image-merge-down img photo EXPAND-AS-NECESSARY)))
      (gimp-drawable-set-name photo "Фото")
      (set! photo (car (gimp-drawable-transform-rotate-default
                         photo 0.07 TRUE 0 0 TRUE FALSE)))
      (script-fu-drop-shadow img photo 8 8 12 vv-black 80 FALSE))

    ; 3. Текст
    (let ((title (vv-text img 34 22 "VaiaVPN" 64 vv-lime)))
      (script-fu-drop-shadow img title 4 4 6 vv-black 80 FALSE))
    (vv-text img 38 96 "Защита. Свобода. Без границ." 20 vv-white)
    (vv-text img 36 142 "VPN бесплатно для всех" 32 vv-white)
    (let ((date (vv-text img 36 180 "до 1 ноября!" 46 vv-light)))
      (script-fu-drop-shadow img date 3 3 6 vv-black 80 FALSE))
    (vv-text img 38 254 "Подключайся через бота в Telegram:" 20 vv-white)
    (vv-text img 36 280 "@VAIAVPN_bot" 38 vv-lime)

    ; полоса снизу со ссылкой на бонус
    (let ((band (vv-new-layer img 800 400 "Полоса" 65)))
      (gimp-rect-select img 0 350 800 50 CHANNEL-OP-REPLACE FALSE 0)
      (gimp-context-set-foreground vv-black)
      (gimp-edit-fill band FOREGROUND-FILL)
      (gimp-selection-none img))
    (vv-text img 38 362 "Ссылка на бонус — в закрепе нашего ТГ-канала!" 20 vv-white)

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

(define (script-fu-vaiavpn-banner earth-file photo-file out-dir)
  (vv-build earth-file photo-file (string-append out-dir DIR-SEPARATOR) TRUE))

(script-fu-register "script-fu-vaiavpn-banner"
  "VaiaVPN баннер..."
  "Рекламный баннер VaiaVPN 800x400"
  "VaiaVPN"
  "VaiaVPN"
  "2026"
  ""
  SF-FILENAME "Фон (Земля ночью)" "earth_night.jpg"
  SF-FILENAME "Фото" "phone.jpg"
  SF-DIRNAME  "Папка для сохранения" "")

(script-fu-menu-register "script-fu-vaiavpn-banner" "<Image>/File/Create")
