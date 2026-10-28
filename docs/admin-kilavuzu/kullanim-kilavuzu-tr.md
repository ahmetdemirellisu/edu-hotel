# EDU Eğitim Oteli Yönetim Paneli Kullanım Kılavuzu

Bu kılavuz, EDU Eğitim Oteli'nin rezervasyon sistemini yönetecek kişiler için hazırlanmıştır. Panele nasıl girileceğini, rezervasyon taleplerinin nasıl onaylanacağını, ödemelerin nasıl kontrol edileceğini, odaların nasıl atanacağını ve otel ayarlarının nasıl değiştirileceğini adım adım anlatır.

Kılavuzdaki ekran görüntüleri örnek verilerle alınmıştır. Sizin ekranınızdaki isimler, tarihler ve sayılar farklı olacaktır.

## İçindekiler

1. [Panele giriş ve çıkış](#1-panele-giriş-ve-çıkış)
2. [Ekranı tanıyalım](#2-ekranı-tanıyalım)
3. [Bir rezervasyonun yolculuğu](#3-bir-rezervasyonun-yolculuğu)
4. [Gösterge Paneli](#4-gösterge-paneli)
5. [Rezervasyonlar](#5-rezervasyonlar)
6. [Yeni Rezervasyon](#6-yeni-rezervasyon)
7. [Takvim](#7-takvim)
8. [Odalar](#8-odalar)
9. [Misafirler](#9-misafirler)
10. [Ödemeler](#10-ödemeler)
11. [Kara Liste](#11-kara-liste)
12. [Raporlar](#12-raporlar)
13. [Ayarlar](#13-ayarlar)
14. [Profil ve oturum](#14-profil-ve-oturum)
15. [Sık sorulan sorular](#15-sık-sorulan-sorular)
16. [Ek: Misafirlere otomatik giden e-postalar](#16-ek-misafirlere-otomatik-giden-e-postalar)

---

## 1. Panele giriş ve çıkış

### Giriş

1. Tarayıcınızda yönetim paneli giriş adresini açın. Adres size sistem sorumlusu tarafından iletilir ve `/admin-login` ile biter.
2. **Kullanıcı Adı** ve **Şifre** alanlarını doldurun.
3. **Yönetici girişi** düğmesine tıklayın.
4. "Erişim Onaylandı" mesajından sonra panel açılır.

Bilmeniz gerekenler:

- Yönetim paneli girişi, misafirlerin kullandığı e-posta ile giriş sayfasından farklıdır. Misafir giriş sayfasına kullanıcı adınızı yazarsanız "Lütfen geçerli bir e-posta adresi girin" uyarısı alırsınız.
- Kullanıcı adınızı veya şifrenizi değiştirmek için sistem sorumlusuna başvurun. Bu bilgiler panelden değiştirilemez.
- Art arda 5 hatalı denemede giriş 30 saniye kilitlenir. Süre dolunca tekrar deneyebilirsiniz.

### Oturum süresi

- Oturumunuz 8 saat açık kalır. Süre dolunca yeniden giriş yapmanız gerekir.
- Oturum yalnızca açık olan tarayıcı sekmesinde geçerlidir. Sekmeyi veya tarayıcıyı kapattığınızda oturum kapanır.

### Çıkış

Sağ üst köşedeki **Yönetici** alanına tıklayın ve açılan menüden **Çıkış yap**'ı seçin. Ortak kullanılan bilgisayarlarda işiniz bittiğinde mutlaka çıkış yapın.

---

## 2. Ekranı tanıyalım

![Yönetim panelinin genel görünümü](gorseller/01-genel-gorunum.png)

Panel üç bölümden oluşur:

**Sol menü.** Sayfalar arasında geçiş yapmak için kullanılır. Menü üç gruba ayrılmıştır:

| Grup | Sayfalar |
|---|---|
| Ana | Gösterge Paneli, Rezervasyonlar, Yeni Rezervasyon, Takvim |
| Yönetim | Odalar, Misafirler, Ödemeler, Kara Liste |
| Sistem | Raporlar, Yönetici Kullanıcılar, Ayarlar |

**Üst çubuk.** Solda bulunduğunuz sayfanın adı yazar. Sağda dil seçimi (**EN** / **TR**) ve hesap menünüz bulunur. Dil seçimi yalnızca sizin ekranınızın dilini değiştirir, misafirleri etkilemez.

**İçerik alanı.** Seçtiğiniz sayfanın içeriği burada görünür.

### Menüyü daraltma

Ekranda daha fazla yer açmak için sol menünün en altındaki **Daralt** düğmesine tıklayın. Menü yalnızca simgelerden oluşan dar bir şeride dönüşür. Simgelerin üzerine geldiğinizde sayfa adı görünür. Menüyü tekrar açmak için en alttaki ok simgesine tıklayın.

![Daraltılmış menü](gorseller/02-menu-daraltilmis.png)

Panel telefon ve tabletlerde de açılır. Küçük ekranlarda menü, sol üstteki üç çizgili simgeye dokunarak açılır.

---

## 3. Bir rezervasyonun yolculuğu

Paneldeki işlerin çoğu, aşağıdaki sürecin bir adımıdır. Kılavuzun geri kalanını okumadan önce bu bölümü anlamanız işinizi kolaylaştırır.

| Adım | Kim yapar | Ne olur | Misafire e-posta gider mi? |
|---|---|---|---|
| 1. Talep | Misafir | Misafir siteden rezervasyon talebi oluşturur. Talep **Beklemede** durumundadır. | Evet, "talebiniz alındı" |
| 2. Onay veya ret | Siz | Talebi fiyat belirleyerek **onaylarsınız** ya da **reddedersiniz**. | Evet, fiyatlı onay veya ret bildirimi |
| 3. Ödeme | Misafir | Misafir banka havalesi yapar ve dekontu sisteme yükler. Ödeme **Doğrulama Bekliyor** durumuna geçer. | Evet, "dekontunuz alındı" |
| 4. Ödeme kontrolü | Siz | Dekontu kontrol edip **onaylarsınız** ya da **reddedersiniz**. Reddedilirse misafir yeni dekont yükler. | Evet, "rezervasyonunuz kesinleşti" veya "dekont kabul edilmedi" |
| 5. Oda atama | Siz | Rezervasyona bir veya daha fazla oda atarsınız. | Evet, oda bilgisiyle |

Rezervasyonun iki ayrı durumu vardır ve ikisi ayrı takip edilir:

**Rezervasyon durumu**

| Durum | Anlamı |
|---|---|
| Beklemede | Talep sizin onayınızı bekliyor. |
| Onaylandı | Talep onaylandı. Ödeme ve oda süreci devam ediyor olabilir. |
| Reddedildi | Talebi reddettiniz. Süreç sona erdi. |
| İptal edildi | Misafir rezervasyonunu kendisi iptal etti. |

**Ödeme durumu**

| Durum | Anlamı |
|---|---|
| Boş (–) | Misafir henüz dekont yüklemedi. |
| Beklemede / Doğrulama Bekliyor | Dekont yüklendi, sizin kontrolünüzü bekliyor. |
| Ödendi | Dekontu onayladınız. |
| Reddedildi | Dekontu reddettiniz, misafirden yenisi bekleniyor. |

### Misafirlerin uyması gereken kurallar

Sistem, misafirlerin aşağıdaki kurallara uymayan talep oluşturmasına izin vermez. Bu kuralları bilmek, misafirlerden gelen soruları yanıtlarken işinize yarar.

- Pazar günü giriş yapılamaz.
- Cumartesi giriş ve Pazar çıkış birlikte seçilemez.
- Kişisel konaklamalar en fazla 5 gece sürebilir.
- Talepler en fazla 30 gün sonrası için oluşturulabilir.
- Kurumsal ve eğitim amaçlı konaklamalarda program kodu zorunludur.
- Misafir, girişe 24 saatten fazla varsa ve ödemesi henüz onaylanmamışsa rezervasyonunu kendisi iptal edebilir.

Gece ve gün sınırlarını [Ayarlar](#13-ayarlar) sayfasından değiştirebilirsiniz.

---

## 4. Gösterge Paneli

Panele girdiğinizde ilk bu sayfa açılır. Günün durumunu tek bakışta görmenizi sağlar.

![Gösterge Paneli, üst bölüm](gorseller/03-gosterge-paneli-ust.png)

Üst kısımdaki dört kart:

| Kart | Ne gösterir |
|---|---|
| Bekleyen Talepler | Onayınızı bekleyen talep sayısı |
| Onaylandı | Onaylanmış rezervasyon sayısı |
| Konaklayan Misafirler | Bugün otelde kalan misafir sayısı (kişi sayısı) |
| Müsait Odalar | Bakımda veya özel misafirlere ayrılmış olmayan oda sayısı |

Kartlardaki **Tümünü gör** bağlantısı sizi ilgili sayfaya götürür.

**Son Rezervasyonlar** listesinde en son oluşturulan rezervasyonları, giriş ve çıkış tarihlerini, rezervasyon ve ödeme durumlarını görürsünüz. Tam listeye gitmek için **Tümünü gör**'e tıklayın.

Sağ üstteki **Yeni Rezervasyon** düğmesi sizi doğrudan [rezervasyon oluşturma](#6-yeni-rezervasyon) sayfasına götürür.

![Gösterge Paneli, alt bölüm](gorseller/04-gosterge-paneli-alt.png)

Sayfanın alt kısmında:

- **Hızlı İşlemler:** Takvim, Oda Yönetimi, Bekleyen Ödemeler ve Raporlar sayfalarına kısayollar.
- **Bekleyen talep uyarısı:** Onay bekleyen talep varsa sarı bir kutuda kaç tane olduğu yazar. **Şimdi incele**'ye tıklayarak talepleri açabilirsiniz.

Günlük işe başlarken önerilen sıra: önce bekleyen talepleri, sonra [Ödemeler](#10-ödemeler) sayfasındaki dekontları kontrol edin.

Odaların o günkü doluluk durumunu görmek için [Odalar](#8-odalar) sayfasını kullanın.

---

## 5. Rezervasyonlar

Tüm rezervasyonları listeler. Talepleri onaylama, reddetme ve oda atama işlemleri bu sayfadan yapılır.

![Rezervasyon listesi](gorseller/05-rezervasyon-listesi.png)

Listedeki her satırda şunlar yer alır: misafirin adı ve e-postası, konaklama türü (Kişisel, Kurumsal, Eğitim), giriş ve çıkış tarih ve saatleri, rezervasyon durumu, ödeme durumu, atanmış oda ve işlem düğmeleri.

### 5.1 Listeyi filtreleme

Listenin üstündeki sekmelerle rezervasyonları duruma göre süzebilirsiniz: **Tümü**, **Beklemede**, **Onaylandı**, **Reddedildi**, **İptal edildi**. Her sekmenin yanında o durumdaki rezervasyon sayısı yazar.

![Yalnızca bekleyen talepler](gorseller/06-rezervasyon-beklemede.png)

### 5.2 Rezervasyon arama

Arama kutusuna misafirin adını, e-postasını, telefonunu veya rezervasyon numarasını yazın. Liste siz yazdıkça güncellenir. Aramayı temizlemek için kutunun sağındaki çarpıya tıklayın.

![Rezervasyon arama](gorseller/07-rezervasyon-arama.png)

### 5.3 Rezervasyon detayını görüntüleme

Satırın en sağındaki göz simgesine tıklayın. Açılan pencerede rezervasyonun tüm bilgileri bulunur:

- **Misafir Bilgileri:** ad, e-posta, telefon, misafir sayısı
- **Konaklama Detayları:** tarihler, giriş ve çıkış saatleri, atanan oda, konaklama ve fatura türü
- **Faturalama ve Etkinlik:** etkinlik türü, program kodu, T.C. kimlik veya vergi numarası, ücretsiz konaklama bilgisi
- **Ek misafirler, misafirin notu ve yönetici notu** (varsa)
- **Kimlik Belgeleri:** misafirin yüklediği kimlik belgeleri. Belgeyi açmak için adına tıklayın.

![Rezervasyon detayı](gorseller/08-rezervasyon-detay.png)

Beklemedeki bir rezervasyonun detay penceresinde **Onayla** ve **Reddet** düğmeleri de bulunur. Pencereyi kapatmak için **Kapat**'a tıklayın.

### 5.4 Talebi onaylama

1. Beklemedeki rezervasyonun satırında **Onayla**'ya tıklayın.
2. **Fiyat (TL)** alanına konaklamanın toplam ücretini yazın. Bu alan zorunludur ve 0'dan büyük olmalıdır.
3. İsterseniz **Yönetici notu** alanına misafire iletmek istediğiniz bir not yazın. Not en fazla 500 karakter olabilir.
4. **Rezervasyonu Onayla**'ya tıklayın.

![Onay penceresi](gorseller/09-rezervasyon-onay.png)

Onaydan sonra misafire fiyatı ve notunuzu içeren bir e-posta gider. E-postada misafirden ödeme yapıp dekontunu yüklemesi istenir. Banka bilgileri, [Ayarlar](#13-ayarlar) sayfasında girdiğiniz bilgilerdir.

Pazar günü girişli veya Cumartesi giriş ve Pazar çıkışlı talepler onaylanamaz. Bu durumda ekranda bir uyarı görürsünüz.

### 5.5 Talebi reddetme

1. Beklemedeki rezervasyonun satırında **Reddet**'e tıklayın.
2. Açılan kutuya ret sebebini yazın. Sebep yazmak isteğe bağlıdır ama misafirin durumu anlaması için önerilir.
3. **OK**'a tıklayın. Vazgeçmek için **Cancel**'a tıklayın.

![Ret sebebi kutusu](gorseller/10-rezervasyon-reddet.png)

Misafire, yazdığınız sebebi içeren bir e-posta gider. Reddedilen bir talep tekrar onaylanamaz. Misafirin yeni bir talep oluşturması gerekir.

### 5.6 Oda atama

Onaylanmış ve henüz odası olmayan rezervasyonlarda **Oda ata** düğmesi görünür.

1. **Oda ata**'ya tıklayın.
2. Açılan listeden odayı veya odaları işaretleyin. Pencerenin üstünde kaç oda seçtiğiniz ve seçilen odaların toplam kapasitesi görünür.
3. İsterseniz **Yönetici notu** yazın. Bu not oda atama e-postasıyla misafire gönderilir.
4. **Seçilenleri Ata**'ya tıklayın.

![Oda atama penceresi](gorseller/11-oda-atama.png)

Dikkat edilecekler:

- Bakımdaki odalar listede görünmez.
- Misafir sayısından fazla oda seçemezsiniz. Birden fazla misafir aynı odada kalacaksa daha az oda seçebilirsiniz.
- Seçtiğiniz oda aynı tarihlerde başka bir rezervasyona atanmışsa atama yapılmaz ve ekranda uyarı çıkar. Başka bir oda seçin. Odaların dolu olduğu tarihleri [Takvim](#7-takvim) sayfasından kontrol edebilirsiniz.

Oda atamasını ödeme onaylandıktan sonra yapmanız önerilir. Ödemesi onaylanmış ve odası olmayan rezervasyonlar [Ödemeler](#10-ödemeler) sayfasında ayrıca listelenir.

---

## 6. Yeni Rezervasyon

Bu sayfa, misafirin site üzerinden talep oluşturmasına gerek kalmadan doğrudan rezervasyon girmenizi sağlar. Örneğin özel misafirler, kurum konukları veya kendi konaklamanız için kullanılır.

Sayfanın üstünden rezervasyonun kimin için olduğunu seçin:

- **Kendiniz için:** Kendi konaklamanızı girersiniz. Form "Bilgileriniz" başlığıyla açılır.
- **Özel misafir için:** Bir misafir adına rezervasyon girersiniz. Form "Misafir bilgileri" başlığıyla açılır ve misafir türünü seçebilirsiniz (varsayılan: Özel misafir).

![Kendiniz için rezervasyon](gorseller/12-yeni-rezervasyon-kendim.png)

![Özel misafir için rezervasyon](gorseller/13-yeni-rezervasyon-misafir.png)

### Formu doldurma

Zorunlu alanlar:

- **Giriş** ve **Çıkış** tarihleri (çıkış, girişten sonra olmalıdır)
- **E-posta**
- **Misafir sayısı** (en az 1)

"İsteğe bağlı" yazan tüm diğer alanları boş bırakabilirsiniz: giriş ve çıkış saatleri, ad, soyad, telefon, etkinlik türü, program kodu, fatura bilgileri, fiyat, ücretsiz konaklama, misafir notu ve yönetici notu.

Alanları doldurduktan sonra sayfanın altındaki **Rezervasyon Oluştur** düğmesine tıklayın.

### Bilmeniz gerekenler

- **E-posta adresinin önemi:** Girdiğiniz e-posta sistemde kayıtlı bir kullanıcıya aitse rezervasyon o kullanıcının hesabına eklenir. Kayıtlı değilse bu e-postayla yeni bir misafir kaydı oluşturulur.
- **Durum:** Bu sayfadan oluşturulan rezervasyonlar doğrudan **Onaylandı** durumunda başlar. Ayrıca onaylamanız gerekmez.
- **Kurallar uygulanmaz:** Misafirler için geçerli kurallar (Pazar girişi, gece sınırı, 30 gün sınırı) burada uygulanmaz.
- **E-posta gitmez:** Bu sayfadan rezervasyon oluşturduğunuzda misafire e-posta gönderilmez. Misafiri ayrıca bilgilendirin.
- **Oda atama:** Bu sayfada oda seçilmez. Rezervasyonu oluşturduktan sonra [Rezervasyonlar](#56-oda-atama) sayfasından **Oda ata** ile oda atayın.

---

## 7. Takvim

Odaların ay boyunca hangi günlerde dolu olduğunu gösterir.

![Oda doluluk takvimi](gorseller/14-takvim.png)

- Her satır bir odadır, her sütun ayın bir günüdür. Hafta sonları kırmızı yazılır.
- Dolu günler, misafirin adının yazdığı renkli bir şeritle gösterilir. Yeşil şeritler onaylanmış, sarı şeritler bekleyen rezervasyonlardır.
- Başlığın altında o ay kaç rezervasyon olduğu ve kaç odanın dolu olduğu yazar.
- Aylar arasında geçmek için sağ üstteki ok düğmelerini, bulunduğunuz aya dönmek için **Bugün**'ü kullanın.

Takvimde yalnızca oda atanmış rezervasyonlar görünür. Odası henüz atanmamış rezervasyonları [Rezervasyonlar](#5-rezervasyonlar) veya [Ödemeler](#10-ödemeler) sayfasında bulabilirsiniz.

---

## 8. Odalar

Otelin 2. katındaki 49 odanın durumunu gösterir ve oda durumlarını değiştirmenizi sağlar. 47 oda tek kişilik, 210 ve 242 numaralı odalar çift kişiliktir.

### 8.1 Kat planı ve kartlar

Sayfa iki şekilde görüntülenebilir. Sağ üstteki **Kat Planı** ve **Kartlar** düğmeleriyle aralarında geçiş yapın.

**Kat Planı** odaları katın gerçek yerleşimine göre gösterir:

![Kat planı görünümü](gorseller/15-odalar-kat-plani.png)

**Kartlar** odaları numara sırasıyla listeler. Dolu odaların kartında misafirin adı ve rezervasyon numarası yazar:

![Kart görünümü](gorseller/18-odalar-kartlar.png)

Odalar renkleriyle ayırt edilir:

| Renk | Durum | Anlamı |
|---|---|---|
| Yeşil | Müsait | Oda boş ve rezervasyona açık. |
| Kırmızı | Dolu | Seçili tarihte odada kalan bir misafir var. |
| Sarı | Bakımda | Oda kullanım dışı. Oda atamada listelenmez. |
| Mavi | Rezerve | Oda özel misafirlere ayrılmış. Sistem üzerinden rezervasyon yapılamaz. |

Sayfanın üstünde her durumdaki oda sayısı yazar. Tarih kutusunu veya yanındaki okları kullanarak başka bir günün durumuna bakabilirsiniz.

### 8.2 Oda detayını görüntüleme

Bir odaya tıklayın. Sağda odanın türü, kapasitesi ve olanakları açılır. Oda doluysa, o tarihte kalan misafirin adı, rezervasyon numarası ve konaklama tarihleri de görünür.

![Dolu bir odanın detayı](gorseller/16-oda-dolu.png)

### 8.3 Oda durumunu değiştirme

Bir odayı bakıma almak veya özel misafirlere ayırmak için:

1. Odaya tıklayın.
2. **Temel Durumu Değiştir** listesinden yeni durumu seçin: **Müsait**, **Bakımda** veya **Rezerve (Özel Misafirler)**.
3. **Durumu Güncelle**'ye tıklayın.

![Bakımdaki bir odanın detayı](gorseller/17-oda-bakimda.png)

"Dolu" durumu elle seçilmez. Sistem, odaya atanmış rezervasyonların tarihlerine göre bunu kendisi belirler.

Bakım veya özel kullanım sona erdiğinde odayı tekrar **Müsait** yapmayı unutmayın. Aksi halde oda, oda atama listesinde görünmez.

---

## 9. Misafirler

Sistemde kayıtlı tüm kullanıcıları gösterir.

![Misafir listesi](gorseller/19-misafir-listesi.png)

Her misafir kartında misafirin adı, e-postası, misafir türü (Öğrenci, Personel, Özel misafir, Veli, Diğer), durumu (Aktif veya Kara listede) ve toplam rezervasyon sayısı yer alır. Sayfanın sağ üstünde aktif ve engelli misafir sayıları yazar.

### 9.1 Arama ve filtreleme

- Arama kutusuna misafirin adını veya e-postasını yazın.
- Soldaki düğmelerle misafir türüne göre süzün: **Tüm Türler**, **Öğrenci**, **Personel**, **Özel Misafir**, **Veli / Vasi**.
- Sağdaki düğmelerle duruma göre süzün: **Tüm Durumlar**, **Aktif**, **Kara listede**.

Kara listedeki misafirlerin kartında kara listeye alınma sebebi de görünür:

![Kara listedeki misafirler](gorseller/20-misafir-kara-liste-filtresi.png)

### 9.2 Misafir detayı

Misafir kartındaki **Görüntüle**'ye tıklayın. Açılan pencerede misafirin rezervasyon geçmişini görürsünüz.

![Misafir detayı](gorseller/21-misafir-detay.png)

### 9.3 Bir misafire özel ileri tarih sınırı

Misafirler normalde en fazla 30 gün sonrası için rezervasyon talebi oluşturabilir. Belirli bir misafirin daha ileri tarihler için talep oluşturması gerekiyorsa:

1. Misafirin detay penceresini açın.
2. **Maksimum Önceden Rezervasyon (Gün)** alanına gün sayısını yazın.
3. **Kaydet**'e tıklayın.

Genel sınıra dönmek için alanı boşaltıp **Kaydet**'e tıklayın.

### 9.4 Misafiri kara listeye ekleme veya çıkarma

Misafir kartındaki **Kara listeye ekle** düğmesine tıklayın, açılan kutuya sebebi yazın ve onaylayın. Kara listedeki bir misafirin kartında bu düğmenin yerine **Kara listeden çıkar** görünür.

Kara listeye geçici engel eklemek veya tüm engelli kullanıcıları tek yerden yönetmek için [Kara Liste](#11-kara-liste) sayfasını kullanın.

---

## 10. Ödemeler

Misafirlerin yüklediği ödeme dekontlarını kontrol ettiğiniz ve ödemesi onaylanan rezervasyonlara oda atadığınız sayfadır.

![Ödemeler sayfası](gorseller/22-odemeler.png)

Sayfanın üstündeki kartlar, doğrulama bekleyen dekont sayısını ve o gün onaylanan ve reddedilen dekont sayılarını gösterir. Listeyi güncellemek için sağ üstteki **Yenile** düğmesine tıklayın.

### 10.1 Dekontu inceleme

Her dekont kartında misafirin adı, e-postası ve rezervasyon numarası yazar.

- **Önizle:** Dekontu sayfadan ayrılmadan bir pencerede açar.
- **İndir:** Dekontu bilgisayarınıza kaydeder.

![Dekont önizleme](gorseller/24-dekont-onizleme.png)

Dekontu onaylamadan önce şunları banka hesap hareketlerinizle karşılaştırın:

- Ödenen tutar, rezervasyonu onaylarken belirlediğiniz fiyatla aynı mı?
- Ödeme doğru hesaba (IBAN) yapılmış mı?
- Gönderen adı ve açıklama, misafir ve rezervasyon numarasıyla uyuşuyor mu?

Rezervasyonun fiyatını görmek için [Rezervasyonlar](#53-rezervasyon-detayını-görüntüleme) sayfasında rezervasyonun detayını açabilirsiniz.

### 10.2 Ödemeyi onaylama

1. Dekont kartındaki **Onayla**'ya tıklayın.
2. "Ödeme onaylanacak. Emin misiniz?" sorusunda **OK**'a tıklayın.

![Ödeme onay sorusu](gorseller/25-odeme-onay.png)

Ödeme **Ödendi** olarak işaretlenir ve misafire "rezervasyonunuz kesinleşti" e-postası gider. Bu e-postada oda kartı teslim bilgileri de yer alır. Rezervasyon, oda atanması için aşağıdaki **Oda Atama Bekleyenler** listesine geçer.

### 10.3 Ödemeyi reddetme

1. Dekont kartındaki **Reddet**'e tıklayın.
2. Açılan kutuya sebebi yazın, örneğin "Tutar eksik" veya "Dekont okunamıyor". Sebep isteğe bağlıdır.
3. **OK**'a tıklayın.

![Ödeme ret sebebi kutusu](gorseller/26-odeme-ret.png)

Misafire, sebebi içeren ve yeni dekont yüklemesini isteyen bir e-posta gider. Misafir yeni dekont yüklediğinde kayıt tekrar bu listeye düşer.

### 10.4 Oda atama bekleyenler

Sayfanın alt bölümünde, ödemesi onaylanmış ama henüz odası atanmamış rezervasyonlar listelenir. Her satırda misafirin adı, rezervasyon numarası, tarihler ve misafir sayısı yazar.

![Oda atama bekleyen rezervasyonlar](gorseller/23-odemeler-oda-atama.png)

**Oda Ata**'ya tıklayın ve [Oda atama](#56-oda-atama) bölümündeki adımları izleyin. Liste boşaldığında tüm ödenmiş rezervasyonlara oda atanmış demektir.

---

## 11. Kara Liste

Kara listeye eklenen kullanıcılar sisteme giriş yapamaz ve rezervasyon talebi oluşturamaz.

![Kara liste](gorseller/27-kara-liste.png)

Kara listeyi yalnızca ödenmeyen borçlar, dolandırıcılık veya otele verilen zarar gibi ciddi durumlarda kullanın. Sebep alanına kişisel veri içermeyen, olgusal bir açıklama yazın ve KVKK gerekliliklerine uyun.

Listede her kullanıcının adı, e-postası, sebebi, eklenme tarihi ve geçici engellerde bitiş tarihi görünür. Kalıcı engeller "Kalıcı" etiketiyle gösterilir.

### 11.1 Kara listeye ekleme

1. Sağ üstteki **Kara listeye ekle**'ye tıklayın.
2. Arama kutusuna kullanıcının ID'sini, e-postasını veya adını yazın ve çıkan sonuçlardan kullanıcıyı seçin.
3. **Blok türü**'nü seçin:
   - **Kalıcı blok:** Bitiş tarihi yoktur.
   - **Geçici (tarihe kadar):** Bir bitiş tarihi seçmeniz istenir.
4. **Sebep** alanını doldurun. Bu alan zorunludur.
5. **Kullanıcıyı Engelle**'ye tıklayın.

![Kara listeye ekleme penceresi](gorseller/28-kara-listeye-ekle.png)

### 11.2 Kara listeden çıkarma

Kullanıcının satırındaki **Kara listeden çıkar** düğmesine tıklayın ve onaylayın. Kullanıcı hemen tekrar giriş yapabilir ve talep oluşturabilir.

**Önemli:** Geçici engellerin bitiş tarihi geldiğinde engel kendiliğinden kalkmaz. Bitiş tarihi gelen kullanıcıları bu sayfadan elle çıkarın. Bitiş tarihini kontrol etmek için listedeki tarih bilgisine bakabilirsiniz.

---

## 12. Raporlar

Rezervasyon, doluluk ve gelir bilgilerini dosya olarak indirmenizi sağlar.

![Raporlar sayfası](gorseller/29-raporlar.png)

### Rapor türleri

| Rapor | İçeriği | Tarih seçmezseniz |
|---|---|---|
| Günlük rapor | Seçilen günün girişleri, çıkışları, o gün otelde kalanlar ve özet sayılar | Bugün |
| Aylık rapor | Girişi seçilen aralıkta olan tüm rezervasyonlar, durumları, ödeme durumları ve fiyatları; durumlara göre özet | Bu ay |
| Oda doluluk raporu | Her odanın seçilen aralıkta kaç gece dolu olduğu | Son 30 gün |
| Gelir raporu | Rezervasyon bazında tutarlar; toplam, onaylanmış ve doğrulama bekleyen gelir | Son 30 gün |

### Rapor oluşturma

1. Rapor türünün kartına tıklayın. Seçilen kartın sağındaki daire işaretlenir.
2. İsterseniz **Tarih Aralığı** bölümünden **Başlangıç** ve **Bitiş** tarihlerini seçin. Boş bırakırsanız yukarıdaki tablodaki varsayılan aralık kullanılır.
3. **Rapor Oluştur**'a tıklayın.

Rapor CSV dosyası olarak bilgisayarınıza iner. Dosyayı Excel, Numbers veya Google Sheets ile açabilirsiniz. Türkçe karakterler doğru görünür.

---

## 13. Ayarlar

Otelin iletişim bilgileri, rezervasyon kuralları, misafirlere gösterilen bilgiler ve banka bilgileri bu sayfadan yönetilir.

![Ayarlar, otel kimliği ve rezervasyon kuralları](gorseller/30-ayarlar-1.png)

### 13.1 Otel Kimliği

| Alan | Nerede kullanılır |
|---|---|
| Otel adı | Platformda görüntülenen isim |
| İletişim e-postası | Misafirlere giden e-postalarda ve destek sayfalarında |
| İletişim telefonu | Misafir sayfalarında |

### 13.2 Rezervasyon Kuralları

| Ayar | Ne işe yarar |
|---|---|
| Rezervasyonları otomatik onayla | Açıkken yeni talepler sizin onayınızı beklemeden **Onaylandı** olarak oluşur. |
| E-posta Bildirimleri | Kapalıyken misafirlere işlem e-postaları (onay, ret, ödeme, oda atama) gönderilmez. Şifre sıfırlama e-postaları her durumda gönderilir. |
| Maksimum önceden rezervasyon (gün) | Misafirlerin en fazla kaç gün sonrası için talep oluşturabileceği. Varsayılan: 30. |
| Maksimum ardışık gece (kişisel) | Kişisel konaklamalarda izin verilen en fazla gece sayısı. Varsayılan: 5. |

Otomatik onay açıkken talepler fiyat belirlenmeden onaylanır ve sizin onay penceresinde yaptığınız fiyat girişi atlanır. Bu ayarı açmadan önce fiyatlandırmanın nasıl yapılacağını netleştirin.

### 13.3 Misafire Yönelik Bilgiler ve Wi-Fi

![Ayarlar, misafir bilgileri ve Wi-Fi](gorseller/31-ayarlar-2.png)

- **Giriş saati, Çıkış saati:** Onay e-postalarında ve misafir panelinde gösterilir.
- **Kahvaltı saatleri, Resepsiyon saatleri:** Misafir panelinde gösterilir.
- **Misafir Wi-Fi (Ağ adı ve Şifre):** Misafir panelindeki bilgi bölümünde gösterilir.

### 13.4 Banka Havalesi Bilgileri

![Ayarlar, banka bilgileri ve kaydetme](gorseller/32-ayarlar-3.png)

**Banka adı**, **Hesap sahibi** ve **IBAN**, rezervasyonu onaylanan misafire ödeme sayfasında gösterilir. Misafirler ödemeyi bu hesaba yapar.

**IBAN'ı değiştirirken çok dikkatli olun.** Hatalı bir IBAN, misafirlerin ödemeyi yanlış hesaba göndermesine yol açar. Kaydetmeden önce IBAN'ı iki kez kontrol edin.

### 13.5 Değişiklikleri kaydetme

Değişiklik yaptığınızda sayfanın altında "Kaydedilmemiş değişiklikler" yazar. **Ayarları kaydet**'e tıklayın. Kayıt tamamlanınca "Ayarlar kaydedildi!" mesajı çıkar ve yazı "Tüm değişiklikler kaydedildi" olarak değişir.

Kaydetmeden sayfadan çıkarsanız değişiklikler kaybolur. Kaydedilen ayarlar en geç bir dakika içinde misafir sayfalarına yansır.

---

## 14. Profil ve oturum

Sağ üstteki **Yönetici** alanına tıklayıp **Profil ayarları**'nı seçerek profil sayfanızı açabilirsiniz.

![Profil sayfası](gorseller/33-profil.png)

- **Hesap Bilgileri:** kullanıcı adınız ve rolünüz
- **Mevcut Oturum:** giriş saatiniz, tarihiniz, kullandığınız tarayıcı ve platform

Sayfanın üstündeki **Çıkış Yap** düğmesiyle de oturumu kapatabilirsiniz. Şifre değişikliği için sistem sorumlusuna başvurun.

---

## 15. Sık sorulan sorular

**Onayla düğmesine bastım ama talep onaylanmadı.**
Talep Pazar girişli veya Cumartesi giriş ve Pazar çıkışlı olabilir. Bu talepler onaylanamaz. Ayrıca onay penceresinde fiyatın 0'dan büyük olduğundan emin olun.

**Bir rezervasyonda "Oda ata" düğmesi görünmüyor.**
Oda yalnızca **Onaylandı** durumundaki ve henüz odası olmayan rezervasyonlara atanabilir. Rezervasyon beklemedeyse önce onaylayın. Zaten odası varsa, oda sütununda oda numarası yazar.

**Oda atarken "zaten dolu" uyarısı alıyorum.**
Seçtiğiniz oda aynı tarihlerde başka bir rezervasyona atanmış. [Takvim](#7-takvim) sayfasından boş odaları kontrol edip başka bir oda seçin.

**Atamak istediğim oda listede yok.**
Oda **Bakımda** durumunda olabilir. [Odalar](#8-odalar) sayfasından durumunu **Müsait** yapın.

**Dekontu onaylarken "dosya bulunamadı" uyarısı alıyorum.**
Dekont dosyasına ulaşılamıyor. Dekontu reddedip misafirden yeniden yüklemesini isteyin. Sorun tekrarlanırsa sistem sorumlusuna bildirin.

**Misafir sisteme giriş yapamadığını söylüyor.**
Önce [Kara Liste](#11-kara-liste) sayfasını kontrol edin. Misafir kara listede değilse, giriş sayfasındaki "Şifrenizi mi unuttunuz?" bağlantısıyla şifresini sıfırlamasını önerin.

**Onaylanmış bir rezervasyonu iptal etmem gerekiyor.**
Panelde onaylanmış bir rezervasyonu iptal etme işlemi bulunmaz. Misafir, girişe 24 saatten fazla varsa ve ödemesi henüz onaylanmamışsa kendi hesabından iptal edebilir. Diğer durumlar için sistem sorumlusuyla iletişime geçin.

**Misafir 30 günden daha ileri bir tarih için rezervasyon yapmak istiyor.**
O misafire özel bir sınır tanımlayabilirsiniz. Bkz. [Bir misafire özel ileri tarih sınırı](#93-bir-misafire-özel-ileri-tarih-sınırı). Alternatif olarak rezervasyonu [Yeni Rezervasyon](#6-yeni-rezervasyon) sayfasından siz girebilirsiniz.

**Oturumum aniden kapandı.**
Oturum 8 saat sonra veya tarayıcı sekmesi kapatıldığında sona erer. Tekrar giriş yapın.

---

## 16. Ek: Misafirlere otomatik giden e-postalar

Aşağıdaki e-postalar sistem tarafından otomatik gönderilir. E-postalar, misafirin seçtiği dile göre Türkçe veya İngilizce gider. [Ayarlar](#13-ayarlar) sayfasında **E-posta Bildirimleri** kapalıysa bu e-postalar gönderilmez.

| Ne zaman | Konu |
|---|---|
| Misafir talep oluşturduğunda | EDU Hotel – Rezervasyon talebi alındı |
| Talebi onayladığınızda | EDU Hotel – Rezervasyon onaylandı |
| Talebi reddettiğinizde | EDU Hotel – Rezervasyon reddedildi |
| Misafir dekont yüklediğinde | EDU Hotel – Ödeme dekontu alındı |
| Ödemeyi onayladığınızda | EDU Hotel – Rezervasyonunuz kesinleşti |
| Ödemeyi reddettiğinizde | EDU Hotel – Ödeme dekontu kabul edilmedi |
| Oda atadığınızda | EDU Hotel – Oda atandı |
| Misafir rezervasyonunu iptal ettiğinde | EDU Hotel – Rezervasyon iptal edildi |

Her konunun sonunda rezervasyon numarası yer alır.

Onay e-postalarında misafire şu oda kartı teslim bilgisi iletilir: 16:30'a kadar olan girişlerde oda kartı resepsiyondan imza karşılığı alınır. 16:30'dan sonraki girişlerde oda kartı kapalı bir zarfla ana güvenlik kapısına bırakılır. Misafirden girişte geçerli bir kimlik belgesi göstermesi istenir.
