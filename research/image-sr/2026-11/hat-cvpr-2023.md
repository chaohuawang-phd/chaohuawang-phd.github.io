---
layout: page
title: HAT CVPR 2023 论文精读
permalink: /research/image-sr/2026-11/hat-cvpr-2023/
description: 从局部归因、混合注意力与重叠窗口理解HAT，核对公式、消融和预训练证据边界。
nav: false
math: true
---

HAT 说明了一个容易被“Transformer 擅长长程依赖”掩盖的问题：网络理论上能传递远处信息，不代表某个输出区域实际利用了那些信息。作者用归因图发现这一缺口，随后扩大注意力窗口、加入通道注意力和重叠跨窗口注意力，并通过同任务预训练提高结果。证据支持这些选择在经典 bicubic 超分辨设置下贡献性能；它没有证明“激活像素越多就一定越好”，也没有建立对真实退化、感知质量或截至 2026 年所有方法的总体领先。

精读日期：2026 年 11 月 2 日，北京时间。同日补入 6 张论文原图及中文读图说明。本文讨论 HAT 自身的证据，不据此判断截至该日期的总体 SOTA。

## 论文与读取范围

Xiangyu Chen、Xintao Wang、Jiantao Zhou、Yu Qiao、Chao Dong，_Activating More Pixels in Image Super-Resolution Transformer_，CVPR 2023，22367–22377。[官方记录](https://openaccess.thecvf.com/content/CVPR2023/html/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.html) · [正文](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf) · [补充材料](https://openaccess.thecvf.com/content/CVPR2023/supplemental/Chen_Activating_More_Pixels_CVPR_2023_supplemental.pdf)

论文类型为算法方法。已读取正文 PDF 第 1–8 页的全文、全部图表和脚注，取得第 9–11 页参考文献清单，读取补充材料全部 2 页；核看正文图 1–9 及补充图 1。没有运行模型，没有逐条核验参考文献，也没有检查代码实现。以下“正文页”均指 PDF 文件页序，不是印刷页码；如正文第 6 页对应印刷页 22372。

## 从具体失败到设计选择

作者的出发点有两部分。首先，图 2 的局部归因图显示，SwinIR 在所示样例中利用的输入范围比 RCAN 窄，但其局部重建 PSNR 反而更高。这提示，至少在该样例中，SwinIR 的优势不能仅用归因范围更广来解释：局部映射能力和利用范围需要分别考虑。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-2-lam.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-2-lam.webp' | relative_url }}" alt="HAT 原图 2：不同网络的局部归因范围、DI及局部重建结果" width="807" height="633" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <strong>原图 2｜不同网络的局部归因范围、DI及局部重建结果。</strong>先看上排红色归因分布与 DI，再看下排重建纹理。这个局部样例中，RCAN、SwinIR、HAT 的 DI 分别为 26.42、19.52、32.32；SwinIR 的归因范围较窄，局部 PSNR 却高于 RCAN。这里展示的是一个选定区域，不能替代数据集平均结果。
    来源：<a href="https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=3">Chen 等，CVPR 2023，图 2，PDF 第 3 页</a>。点击图片可查看原尺寸；图片保留论文原始标签与英文图注。
  </figcaption>
</figure>

其次，图 3 显示 SwinIR 的中间特征保留了窗口边界，作者据此主张仅靠 shifted window 还不足以消除跨窗口信息交换的障碍。[正文第 1–3 页，图 2–3](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=3)

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-3-window-artifacts.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-3-window-artifacts.webp' | relative_url }}" alt="HAT 原图 3：SwinIR与HAT不同层的中间特征及窗口边界" width="807" height="467" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <strong>原图 3｜SwinIR与HAT不同层的中间特征及窗口边界。</strong>上排是 SwinIR，下排是 HAT；绿色箭头标出 SwinIR 中间特征中可见的窗口边界。Layer N 表示第 N 个 RSTB 或 RHAG 之后的特征；这是作者用来说明窗口间交互问题的中间特征可视化。
    来源：<a href="https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=3">Chen 等，CVPR 2023，图 3，PDF 第 3 页</a>。点击图片可查看原尺寸；图片保留论文原始标签与英文图注。
  </figcaption>
</figure>

论文由此押注：保留窗口注意力的局部拟合能力，同时增加可用上下文，可以改善规则纹理的恢复。它用三条路径实现这件事：更大的窗口；依靠全局池化统计调节通道的 CAB；让中心窗口的 query 直接读取较大邻域 key/value 的 OCAB。这是根据论文动机和消融重建的技术逻辑，不代表已经知道作者真实的实验先后顺序。

图 1 的大幅提升还混合了模型扩容和额外预训练。Urban100 ×4 上，表 6 的 SwinIR 为 27.45 dB，HAT 为 27.97 dB，HAT 加 ImageNet 预训练为 28.37 dB，HAT-L 加预训练为 28.60 dB。因此，最终相对 SwinIR 的 1.15 dB 差距不能全部记在某一个注意力模块上。[正文第 7 页，表 6](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=7)

## 方法如何工作

输入为 $I_{LR}\in\mathbb{R}^{H\times W\times 3}$。浅层卷积映射到 $H\times W\times C$，若干残差混合注意力组 RHAG 提取深层特征，与浅层特征相加后通过 PixelShuffle 重建高分辨图像。每个 RHAG 包含若干 HAB、一个 OCAB 和残差卷积。标准 HAT 使用 6 个 RHAG、每组 6 个 HAB、$C=180$、6 个注意力头、窗口宽度 16。训练目标为 L1 像素损失。[正文第 3–5 页，图 4，§3.2、§4.1](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=4)

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-4-architecture.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-4-architecture.webp' | relative_url }}" alt="HAT 原图 4：HAT主干、RHAG、HAB、OCAB和CAB结构" width="1680" height="810" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <strong>原图 4｜HAT主干、RHAG、HAB、OCAB和CAB结构。</strong>先沿上方主干看浅层提取、RHAG 堆叠和重建，再看下方展开图。HAB 中 CAB 与窗口注意力并联，RHAG 内另设 OCAB，用于直接交换相邻窗口的信息。
    来源：<a href="https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=4">Chen 等，CVPR 2023，图 4，PDF 第 4 页</a>。点击图片可查看原尺寸；图片保留论文原始标签与英文图注。
  </figcaption>
</figure>

HAB 中，CAB 和窗口自注意力并联。CAB 的两个卷积先将通道数压缩到 $C/\beta$ 再恢复，减少卷积成本；标准设置 $\beta=3$，即 $180\to60\to180$。之后的通道注意力利用全局统计重标定通道。CAB 的全局性是“全局统计影响通道权重”，不应等同于对所有像素两两计算空间注意力。

OCAB 保留中心窗口的 query，将 key/value 窗口向四周扩展。相邻窗口的信息因此能直接进入中心窗口，而不必完全依赖层间移窗逐步传递。它与 HAB 中交替使用的 shifted window 同时存在。[正文第 4–5 页，图 5，§3.2.3](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=4)

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-5-overlapping-windows.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-5-overlapping-windows.webp' | relative_url }}" alt="HAT 原图 5：4乘4的Query窗口读取6乘6的Key和Value重叠邻域" width="813" height="433" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <strong>原图 5｜4乘4的Query窗口读取6乘6的Key和Value重叠邻域。</strong>Query 保持 4×4 窗口，Key/Value 从扩大的 6×6 邻域读取，滑动步幅仍为 4。扩大的是每个 query 可以访问的候选范围；后面的 16×36 数字算例对应这张图。
    来源：<a href="https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=4">Chen 等，CVPR 2023，图 5，PDF 第 4 页</a>。点击图片可查看原尺寸；图片保留论文原始标签与英文图注。
  </figcaption>
</figure>

## 三个关键公式的数字算例

以下均为手算教学例子，不是论文权重或复现实验。

### 混合残差为什么要给 CAB 较小权重

论文式 1 先做归一化，再融合两个分支：

$$X_N=\mathrm{LN}(X),\quad X_M=\mathrm{WMSA}(X_N)+\alpha\mathrm{CAB}(X_N)+X,$$

$$Y=\mathrm{MLP}(\mathrm{LN}(X_M))+X_M.$$

$X,X_N,X_M,Y$ 形状相同，分支也输出同形状特征；$\alpha$ 是无量纲常数，标准设置为 0.01。对一个具有两个通道的 token，取 $X=[1,3]$，忽略归一化的数值稳定项并取单位仿射参数，则均值为 2、方差为 1，$X_N=[-1,1]$。假定两个已学习分支在这个输入上的输出分别为 $[0.2,0.4]$ 和 $[2,4]$，便有：

$$X_M=[0.2,0.4]+0.01[2,4]+[1,3]=[1.22,3.44].$$

其均值为 2.33，标准差为 1.11，因此再次归一化得到 $[-1,1]$。为完成算例，再假定示例 MLP 为恒等映射，最终 $Y=[0.22,4.44]$。把 $\alpha$ 改为 1，第一步就变成 $[3.2,7.4]$，说明分支量级可能显著改变融合；是否影响实际优化仍需实验，不能由例子证明。表 4 的 $\alpha=0,1,0.1,0.01$ 分别对应 27.81、27.86、27.90、27.97 dB，支持本实验下小权重更有效。[正文第 3、6 页，式 1、表 4](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=6)

### 注意力如何把远处信息加进来

论文式 2 为：

$$A=\mathrm{Softmax}\left(QK^T/\sqrt d+B\right),\qquad O=AV.$$

单头下，$Q\in\mathbb R^{n_q\times d}$，$K\in\mathbb R^{n_k\times d}$，$V\in\mathbb R^{n_k\times d_v}$；$B$ 为相对位置偏置，需能加到 $n_q\times n_k$ 的注意力分数上。取一个 query、两个 key：$Q=[1]$，$K=[1,0]^T$，$V=[10,2]^T$，$d=d_v=1$，$B=0$。分数为 $[1,0]$，归一化权重为：

$$A=[e/(e+1),1/(e+1)]\approx[0.7311,0.2689],$$

$$O=\frac{10e+2}{e+1}\approx7.8485.$$

如果值为 10 的邻居原先位于窗口外，只能读到值 2，则输出为 2；OCA 将它纳入候选后，输出就可能改变。但这个例子只展示信息通路，不保证邻居一定正确，更不保证 PSNR 提高。[正文第 4 页，式 2、图 5](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=4)

### 重叠窗口增加多少交互

式 3 定义 $M_o=(1+\gamma)M$，其中 $M$ 是 query 窗口边长，$\gamma$ 为重叠比例，$M_o$ 是 key/value 窗口边长。论文图 5 取 $M=4,\gamma=0.5$，得到 $M_o=6$，步幅仍为 4，每侧补 1 个像素。

因此每头有 16 个 query token 和 36 个 key/value token，注意力矩阵为 $16\times36$，包含 576 个配对；普通 $4\times4$ 窗口是 $16\times16=256$ 个配对，相差 2.25 倍。实际默认 $M=16$、$\gamma=0.5$ 时为 $256\times576$。这只是单次注意力矩阵的配对量，不是整个 HAT 的运行时或 FLOPs 倍数。[正文第 4–5 页，式 3](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=4)

## 哪些设计有证据支持

下表均为论文内的对照，不能自动解释成跨论文公平复现。

| 设计             | 直接证据                                                                        | 能得出的判断                                                    |
| ---------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 窗口 8 增大到 16 | Urban100 ×4：27.45→27.81 dB；53.6G→63.8G Multi-Adds，补充表 1                   | 在本设置下贡献 0.36 dB，同时增加约 19% 运算量                   |
| OCAB             | 基线 27.81→27.91 dB；63.8G→74.7G，正文表 2、补充表 2                            | 有可测量贡献；去掉后仍能重建，不支持“不可缺失”                  |
| CAB              | 基线 27.81→27.91 dB；63.8G→92.8G，同上                                          | 有贡献，成本比单加 OCAB 高                                      |
| CAB 与 OCAB 同用 | 27.97 dB、103.7G，同上                                                          | 合用优于任一单模块；0.16 dB 小于两项单独增益相加的 0.20 dB      |
| CAB 中通道注意力 | 正文表 3：无 CA 为 27.92，有 CA 为 27.97 dB                                     | 支持 0.05 dB 的条件性贡献，不足以断言全局统计是唯一原因         |
| 重叠率           | 正文表 5：γ=0/0.25/0.5/0.75 对应 27.85/27.81/27.91/27.86 dB                     | 并非重叠越大越好；0.5 是所测候选中最好                          |
| 同任务预训练     | 正文表 7：相同训练设置下，Urban100 ×4 微调后 28.28 vs 多相关任务预训练 28.21 dB | 支持所测设置下的 0.07 dB 差异，不建立对所有预训练策略的普遍优势 |

[正文表 1–5](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=5) · [正文表 7](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=8) · [补充表 1–4](https://openaccess.thecvf.com/content/CVPR2023/supplemental/Chen_Activating_More_Pixels_CVPR_2023_supplemental.pdf#page=1)

补充材料的运算量统一按 $64\times64$ LR 输入统计，并明确该复杂度实验不使用包括 ×2 初始化在内的预训练。其补充表 4 还把扩大的 SwinIR-L1/L2 与 HAT 放在接近运算量条件下比较：前两者为 27.53/27.58 dB，HAT 为 27.97 dB。这比直接比较小 SwinIR 与大 HAT 更能排除“仅仅增加计算量”的解释，但仍没有报告多种随机种子的方差。

### 视觉重建效果

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-8-visual-comparison.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-8-visual-comparison.webp' | relative_url }}" alt="HAT 原图 8：不同方法在4倍经典超分辨上的局部纹理重建对比" width="1687" height="967" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <strong>原图 8｜不同方法在4倍经典超分辨上的局部纹理重建对比。</strong>先对照 HR 的线条方向和网格结构，再比较各方法恢复的纹理。图下 PSNR/SSIM 按红框局部计算，不能用作整图或整个数据集的成绩。
    来源：<a href="https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=8">Chen 等，CVPR 2023，图 8，PDF 第 8 页</a>。点击图片可查看原尺寸；图片保留论文原始标签与英文图注。
  </figcaption>
</figure>

## 证据边界与需要保留的细节

**归因范围是机制线索，不能单独证明因果。**图 7 中，合用模块的局部例子 DI 为 27.06，高于只加 OCAB 的 23.93，但其局部 PSNR 为 16.53 dB，反而低于 OCAB 的 16.94 dB；合用模块的局部 SSIM 更高。因此，“更广的归因分布”与“每个指标单调变好”不是一回事。图中局部 PSNR 也不能替代整套 Urban100 平均值。[正文第 6 页，图 7](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=6)

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-7-ablation.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/hat-cvpr-2023/hat-figure-7-ablation.webp' | relative_url }}" alt="HAT 原图 7：CAB与OCAB消融的归因图及局部PSNR和SSIM" width="803" height="423" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <strong>原图 7｜CAB与OCAB消融的归因图及局部PSNR和SSIM。</strong>同时看 DI 与局部重建指标：只加 OCAB 的 DI 为 23.93、PSNR 为 16.94 dB；合用模块的 DI 为 27.06、PSNR 为 16.53 dB。归因范围变广并不保证每个局部质量指标单调提高。
    来源：<a href="https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=6">Chen 等，CVPR 2023，图 7，PDF 第 6 页</a>。点击图片可查看原尺寸；图片保留论文原始标签与英文图注。
  </figcaption>
</figure>

**预训练优势与模型优势需要分开。**常规训练使用 DF2K 的 3,450 张图，MATLAB bicubic 生成 LR，LR 裁块 $64\times64$、batch 32、Adam；从头训练 500K iterations，×4 使用 ×2 权重初始化且训练步数减半。标有 ImageNet 预训练的模型另用约 128 万张 ImageNet 图像训练 800K iterations，再在 DF2K 微调 250K iterations。即使表 6 的训练数据列写 DF2K，也不能忽略 † 标记代表的额外数据与训练预算。[正文表 6与补充 §1](https://openaccess.thecvf.com/content/CVPR2023/supplemental/Chen_Activating_More_Pixels_CVPR_2023_supplemental.pdf#page=1)

**两张表中的同名配置不能直接视为同一结果。**表 7 的 same-task 微调后 Urban100 ×4 为 28.28 dB，而表 6 的 HAT† 为 28.37 dB；Set5 分别为 33.07 和 33.18 dB。表 7说明它采用与被比较策略相同的训练设置，但两张表附近没有给出足够信息让本次阅读完全解释这些数值差异。这里保留配置解释缺口，后续应对照训练配置核验，不能任选更高数值替换。[正文第 7–8 页，表 6–7](https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.pdf#page=8)

**适用范围为失真优化的经典超分辨。**评测是 ×2/×3/×4 的 Set5、Set14、BSD100、Urban100、Manga109，PSNR/SSIM 在 Y 通道计算。该文没有建立真实拍摄退化、未知噪声与压缩、生成式纹理真实性或用户偏好的优势。不得把它与 SeeSR 等真实退化、感知导向结果混在同一总榜。

| 公平比较字段       | 本次从正文与补充取得的信息                                          |
| ------------------ | ------------------------------------------------------------------- |
| 退化与倍率         | MATLAB bicubic，×2/×3/×4                                            |
| 训练数据           | DF2K；† 模型额外 ImageNet；×4常规训练也有×2初始化                   |
| 测试数据与指标     | 五个上述基准，Y 通道 PSNR/SSIM                                      |
| 模型和输入成本     | HAT 20.8M；补充复杂度表按 $64\times64$ LR 输入                      |
| 裁边、量化、自集成 | 所读正文和补充未明确给出足以统一复现的细节，需查代码                |
| 对照训练预算       | 预训练策略对照称相同设置；表6全部外部基线的步数及调参预算未逐一列明 |
| 方差与选择         | 未报告多次运行误差条；未明确消融超参数选择所用独立验证集            |
| 实际延迟、峰值显存 | 所读材料未给出同硬件完整比较；Multi-Adds不能代替延迟                |

论文没有独立的 limitations 小节。以上“未报告”是阅读中的证据边界，不是证实作者使用了不公平做法，也不是正式审稿结论。

## 继续阅读

[本月候选与后续阅读清单]({{ '/research/image-sr/2026-11/' | relative_url }}) · [调研范围与研究路线]({{ '/research/image-sr/' | relative_url }}) · [栏目首页]({{ '/research/image-sr/' | relative_url }})
