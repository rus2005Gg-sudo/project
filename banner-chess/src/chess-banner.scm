; chess-banner.scm — рекламный баннер «Уроки шахмат» 800x400 (GIMP 2.6+, Script-Fu)
;
; Через меню: положите файл в папку scripts профиля GIMP
; (Windows: C:\Users\<имя>\.gimp-2.6\scripts), Фильтры → Script-Fu →
; Обновить сценарии, затем Файл → Создать → Баннер «Уроки шахмат».
;
; Из командной строки:
;   gimp -i -b '(begin (load "chess-banner.scm") (ch-build "wn.svg" "bk.svg" "out/" FALSE))' \
;           -b '(gimp-quit 0)'

(define ch-cream '(245 230 200))
(define ch-gold  '(232 186 70))
(define ch-white '(255 255 255))
(define ch-black '(0 0 0))
(define ch-font-title "Arial Bold")
(define ch-font-bold  "Arial Bold")
(define ch-font       "Arial")

(define (ch-text img x y str size font color)
  (gimp-context-set-foreground color)
  (car (gimp-text-fontname img -1 x y str 0 TRUE size PIXELS font)))

(define (ch-new-layer img w h name opacity)
  (let ((l (car (gimp-layer-new img w h RGBA-IMAGE name opacity NORMAL-MODE))))
    (gimp-image-add-layer img l 0)
    (gimp-drawable-fill l TRANSPARENT-FILL)
    l))

; Круглая кисть нужного диаметра: в 2.8+ размер задаётся отдельно,
; в 2.6 выбирается готовая кисть «Circle (NN)».
(define (ch-brush px)
  (if (defined? 'gimp-context-set-brush-size)
      (begin
        (gimp-context-set-brush "2. Hardness 100")
        (gimp-context-set-brush-size px))
      (gimp-context-set-brush (if (<= px 3) "Circle (03)" "Circle (05)"))))

; Импорт фигуры из SVG сразу нужного размера.
(define (ch-piece img file size x y name)
  (let* ((src (car (file-svg-load RUN-NONINTERACTIVE file file 90 size size 0)))
         (l (car (gimp-layer-new-from-drawable
                   (car (gimp-image-get-active-layer src)) img))))
    (gimp-image-add-layer img l 0)
    (gimp-drawable-set-name l name)
    (gimp-layer-set-offsets l x y)
    (gimp-image-delete src)
    (script-fu-drop-shadow img l 6 4 8 ch-black 70 FALSE)
    l))

; GIMP 2.8+ пишет параметры текста в XCF так, что 2.6 их не читает
; («unexpected number `20', expected number (float)»). Поэтому текстовые
; слои превращаем в обычные и прикрепляем к ним параметры в формате 2.6:
; при открытии 2.6 снова сделает из них редактируемый текст.
(define (ch-fixed6 x)
  (let* ((n (inexact->exact (round (* x 1000000))))
         (frac (number->string (remainder n 1000000))))
    (string-append (number->string (quotient n 1000000)) "."
                   (substring "000000" 0 (- 6 (string-length frac))) frac)))

(define (ch-text-parasite t)
  (let ((c (car (gimp-text-layer-get-color t))))
    (string-append
      "(text \"" (car (gimp-text-layer-get-text t)) "\")\n"
      "(font \"" (car (gimp-text-layer-get-font t)) "\")\n"
      "(font-size " (ch-fixed6 (car (gimp-text-layer-get-font-size t))) ")\n"
      "(color (color-rgb " (ch-fixed6 (/ (car c) 255.0)) " "
                           (ch-fixed6 (/ (cadr c) 255.0)) " "
                           (ch-fixed6 (/ (caddr c) 255.0)) "))\n")))

(define (ch-text-for-gimp26 img)
  (if (defined? 'gimp-item-attach-parasite)
      (for-each
        (lambda (t)
          (if (= (car (gimp-item-is-text-layer t)) TRUE)
              (let* ((name (car (gimp-item-get-name t)))
                     (data (ch-text-parasite t))
                     (offs (gimp-drawable-offsets t))
                     (l (car (gimp-layer-new img (car (gimp-drawable-width t))
                                             (car (gimp-drawable-height t))
                                             RGBA-IMAGE name 100 NORMAL-MODE))))
                (gimp-image-insert-layer img l 0
                                         (car (gimp-image-get-item-position img t)))
                (gimp-drawable-fill l TRANSPARENT-FILL)
                (gimp-layer-set-offsets l (car offs) (cadr offs))
                (gimp-edit-copy t)
                (gimp-floating-sel-anchor (car (gimp-edit-paste l FALSE)))
                (gimp-image-remove-layer img t)
                (gimp-item-set-name l name)
                (gimp-item-attach-parasite l (list "gimp-text-layer" 1 data)))))
        (vector->list (cadr (gimp-image-get-layers img))))))

(define (ch-build knight-file king-file out-dir show)
  (let* ((img (car (gimp-image-new 800 400 RGB)))
         (bg (car (gimp-layer-new img 800 400 RGB-IMAGE "Фон" 100 NORMAL-MODE))))
    (gimp-context-push)
    (gimp-image-undo-disable img)
    (gimp-image-add-layer img bg 0)

    ; 1. Фон: узор «Дерево», затемнить, слева чёрный градиент под текст
    (gimp-context-set-pattern "Wood #1")
    (gimp-edit-fill bg PATTERN-FILL)
    (gimp-brightness-contrast bg -40 10)
    (let ((dark (ch-new-layer img 800 400 "Затемнение" 80)))
      (gimp-context-set-foreground ch-black)
      (gimp-edit-blend dark FG-TRANSPARENT-MODE NORMAL-MODE GRADIENT-LINEAR 100 0
                       REPEAT-NONE FALSE FALSE 1 0 TRUE 0 0 560 0))

    ; 2. Доска 8x8 (вручную через выделения — так цвета клеток одинаковы
    ;    в любой версии GIMP), коричневая окантовка, перспектива и тень
    (let ((edge (ch-new-layer img 336 336 "Доска" 100))
          (cells (ch-new-layer img 320 320 "Клетки" 100)))
      (gimp-context-set-foreground '(70 40 20))
      (gimp-edit-fill edge FOREGROUND-FILL)
      (gimp-context-set-foreground '(240 217 181))
      (gimp-edit-fill cells FOREGROUND-FILL)
      (gimp-selection-none img)
      (let row ((r 0))
        (if (< r 8)
            (begin
              (let col ((c (- 1 (remainder r 2))))
                (if (< c 8)
                    (begin
                      (gimp-rect-select img (* c 40) (* r 40) 40 40 CHANNEL-OP-ADD FALSE 0)
                      (col (+ c 2)))))
              (row (+ r 1)))))
      (gimp-context-set-foreground '(181 136 99))
      (gimp-edit-fill cells FOREGROUND-FILL)
      (gimp-selection-none img)
      (gimp-layer-set-offsets cells 8 8)
      (let ((board (car (gimp-image-merge-down img cells EXPAND-AS-NECESSARY))))
        (gimp-drawable-set-name board "Доска")
        (set! board (car (gimp-drawable-transform-perspective-default
                           board 556 208 744 208 474 382 826 382 TRUE FALSE)))
        (script-fu-drop-shadow img board 0 10 14 ch-black 80 FALSE)))

    ; 3. Импорт фигур: чёрный король дальше, белый конь ближе
    (ch-piece img king-file 150 615 138 "Король")
    (ch-piece img knight-file 170 528 186 "Конь")

    ; 4. Текст
    (let ((title (ch-text img 34 22 "Уроки шахмат" 62 ch-font-title ch-cream)))
      (script-fu-drop-shadow img title 4 4 6 ch-black 80 FALSE))
    (ch-text img 38 100 "Тренер по шахматам — для детей и взрослых" 20 ch-font ch-gold)
    (ch-text img 38 146 "• Обучение с нуля до разряда" 22 ch-font-bold ch-white)
    (ch-text img 38 178 "• Занятия онлайн и очно" 22 ch-font-bold ch-white)
    (ch-text img 38 210 "• Первое занятие — бесплатно!" 22 ch-font-bold ch-white)
    (ch-text img 38 268 "Запишись на пробное занятие:" 20 ch-font ch-cream)
    (let ((phone (ch-text img 36 294 "8 (900) 000-00-00" 40 ch-font-bold ch-gold)))
      (script-fu-drop-shadow img phone 3 3 5 ch-black 80 FALSE))

    ; 5. Золотая рамка поверх всего
    (let ((frame (ch-new-layer img 800 400 "Рамка" 100)))
      (gimp-rect-select img 10 10 780 380 CHANNEL-OP-REPLACE FALSE 0)
      (gimp-context-set-foreground ch-gold)
      (ch-brush 3)
      (gimp-edit-stroke frame)
      (gimp-selection-none img))

    ; обычный режим слоёв, чтобы XCF открывался и в старых версиях GIMP
    (for-each (lambda (l) (gimp-layer-set-mode l NORMAL-MODE))
              (vector->list (cadr (gimp-image-get-layers img))))
    (ch-text-for-gimp26 img)

    ; Сохранение: XCF со слоями + PNG и JPG
    (gimp-image-undo-enable img)
    (gimp-xcf-save 0 img bg (string-append out-dir "chess_banner.xcf")
                   (string-append out-dir "chess_banner.xcf"))
    (let* ((flat (car (gimp-image-duplicate img)))
           (layer (car (gimp-image-flatten flat))))
      (file-png-save RUN-NONINTERACTIVE flat layer
                     (string-append out-dir "chess_banner.png")
                     (string-append out-dir "chess_banner.png")
                     FALSE 9 FALSE FALSE FALSE FALSE FALSE)
      (file-jpeg-save RUN-NONINTERACTIVE flat layer
                      (string-append out-dir "chess_banner.jpg")
                      (string-append out-dir "chess_banner.jpg")
                      0.95 0 1 0 "Уроки шахмат" 2 1 0 2)
      (gimp-image-delete flat))
    (gimp-context-pop)
    (if (= show TRUE)
        (gimp-display-new img)
        (gimp-image-delete img))))

(define (script-fu-chess-banner knight-file king-file out-dir)
  (ch-build knight-file king-file (string-append out-dir DIR-SEPARATOR) TRUE))

(script-fu-register "script-fu-chess-banner"
  "Баннер «Уроки шахмат»..."
  "Рекламный баннер тренера по шахматам 800x400"
  ""
  ""
  "2026"
  ""
  SF-FILENAME "Конь (SVG)" "wn.svg"
  SF-FILENAME "Король (SVG)" "bk.svg"
  SF-DIRNAME  "Папка для сохранения" "")

(script-fu-menu-register "script-fu-chess-banner" "<Image>/File/Create")
